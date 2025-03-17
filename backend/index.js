// app.js
const express = require('express');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const OpenAI = require('openai');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const stripe = require('stripe')('');
const db = require('./db/database'); // Adjust path if needed
const { authMiddleware, JWT_SECRET } = require('./middleware/auth');

const app = express();

/**
 * 1. Webhook Route (Must use `express.raw` for body parsing)
 */
app.post('/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
    const sig = req.headers['stripe-signature'];
    let event;

    try {
        event = stripe.webhooks.constructEvent(
            req.body,
            sig,
            'whsec_your_webhook_secret' // <-- Replace with your actual Stripe webhook secret
        );
    } catch (err) {
        console.error('Webhook signature verification failed:', err.message);
        return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    if (event.type === 'checkout.session.completed') {
        const session = event.data.object;

        try {
            db.transaction(() => {
                // Update user's token balance
                const updateStmt = db.prepare(`
          UPDATE users 
          SET tokens = tokens + ? 
          WHERE id = ?
        `);

                const result = updateStmt.run(
                    parseInt(session.metadata.tokenAmount),
                    parseInt(session.metadata.userId)
                );

                if (result.changes === 0) {
                    throw new Error('Failed to update user tokens');
                }

                // Record the purchase
                const purchaseStmt = db.prepare(`
          INSERT INTO token_purchases (
            user_id, 
            amount, 
            price, 
            stripe_payment_id
          )
          VALUES (?, ?, ?, ?)
        `);

                purchaseStmt.run(
                    session.metadata.userId,
                    session.metadata.tokenAmount,
                    session.amount_total / 100,
                    session.payment_intent
                );
            })();

            console.log(`Successfully updated tokens for user ${session.metadata.userId} (via Webhook).`);
        } catch (error) {
            console.error('Error processing payment completion (webhook):', error);
            return res.status(500).end();
        }
    }

    res.json({ received: true });
});

/**
 * 2. Regular Express Middleware (JSON, CORS, etc.)
 */
app.use(cors());
app.use(express.json());

// 3. Multer Config
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/');
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + path.extname(file.originalname));
    },
});

const upload = multer({
    storage,
    fileFilter: (req, file, cb) => {
        const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/bmp'];
        if (allowedTypes.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error('Invalid file type. Only images are allowed.'), false);
        }
    }
});

// Ensure `uploads` directory exists
if (!fs.existsSync('uploads')) {
    fs.mkdirSync('uploads');
}

// 4. OpenAI Init
const openai = new OpenAI({
    apiKey: '' 
});

// 5. User Registration
app.post('/register', async (req, res) => {
    const { email, password, firstName, lastName } = req.body;

    try {
        const hashedPassword = await bcrypt.hash(password, 10);

        const stmt = db.prepare(`
      INSERT INTO users (email, password_hash, first_name, last_name, tokens)
      VALUES (?, ?, ?, ?, 0)
    `);

        stmt.run(email, hashedPassword, firstName, lastName);

        res.status(201).json({
            message: 'User registered successfully',
            tokens: 0
        });
    } catch (error) {
        if (error.code === 'SQLITE_CONSTRAINT') {
            res.status(400).json({ error: 'Email already exists' });
        } else {
            console.error('Registration error:', error);
            res.status(500).json({ error: 'Error registering user' });
        }
    }
});

// 6. User Login
app.post('/login', async (req, res) => {
    const { email, password } = req.body;

    try {
        const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email);
        if (!user) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        const passwordMatch = await bcrypt.compare(password, user.password_hash);
        if (!passwordMatch) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        // Update last_login
        db.prepare('UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = ?')
            .run(user.id);

        const token = jwt.sign(
            { userId: user.id, email: user.email },
            JWT_SECRET,
            { expiresIn: '24h' }
        );

        res.json({
            token,
            user: {
                id: user.id,
                email: user.email,
                firstName: user.first_name,
                lastName: user.last_name,
                tokens: user.tokens
            }
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: 'Error logging in' });
    }
});

// 7. Get user data
app.get('/user-data', authMiddleware, (req, res) => {
    try {
        const user = db.prepare(`
      SELECT id, email, first_name, last_name, tokens
      FROM users
      WHERE id = ?
    `).get(req.user.userId);

        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        res.json(user);
    } catch (error) {
        console.error('Error fetching user data:', error);
        res.status(500).json({ error: 'Error fetching user data' });
    }
});

// 8. Test Purchase (Dev only)
app.post('/process-test-purchase', authMiddleware, async (req, res) => {
    const { tokenAmount, price } = req.body;
    const userId = req.user.userId;

    try {
        db.transaction(() => {
            // Update user's token balance
            const updateStmt = db.prepare(`
        UPDATE users 
        SET tokens = tokens + ?
        WHERE id = ?
      `);
            const result = updateStmt.run(tokenAmount, userId);
            if (result.changes === 0) {
                throw new Error('Failed to update user tokens');
            }

            // Record the test purchase
            const purchaseStmt = db.prepare(`
        INSERT INTO token_purchases (
          user_id, 
          amount, 
          price, 
          stripe_payment_id
        )
        VALUES (?, ?, ?, ?)
      `);

            purchaseStmt.run(
                userId,
                tokenAmount,
                price,
                'TEST_PURCHASE_' + Date.now()
            );
        })();

        // Get updated token count
        const user = db.prepare('SELECT tokens FROM users WHERE id = ?').get(userId);

        res.json({
            success: true,
            message: 'Test purchase successful',
            newTokenBalance: user.tokens
        });
    } catch (error) {
        console.error('Error processing test purchase:', error);
        res.status(500).json({
            error: 'Failed to process test purchase'
        });
    }
});

// 9. Analysis History
app.get('/analysis-history', authMiddleware, (req, res) => {
    try {
        const analyses = db.prepare(`
      SELECT id, user_id, original_filename, stored_filename, analysis_text, 
             datetime(analysis_date) as analysis_date
      FROM analysis_records 
      WHERE user_id = ? 
      ORDER BY analysis_date DESC
    `).all(req.user.userId);

        res.json(analyses);
    } catch (error) {
        console.error('Error fetching history:', error);
        res.status(500).json({ error: 'Error fetching analysis history' });
    }
});

// 10. Create Payment Session
app.post('/create-payment-session', authMiddleware, async (req, res) => {
    try {
        const { tokenAmount, price } = req.body;

        const session = await stripe.checkout.sessions.create({
            payment_method_types: ['card'],
            line_items: [{
                price_data: {
                    currency: 'usd',
                    product_data: {
                        name: `${tokenAmount} Analysis Tokens`,
                        description: 'Tokens for medical analysis uploads'
                    },
                    unit_amount: Math.round(price * 100) // convert to cents
                },
                quantity: 1
            }],
            mode: 'payment',
            success_url: `http://localhost:3000/dashboard?session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: `http://localhost:3000/dashboard`,
            metadata: {
                userId: req.user.userId,
                tokenAmount: tokenAmount
            }
        });

        res.json({ id: session.id });
    } catch (error) {
        console.error('Stripe session error:', error);
        res.status(500).json({ error: 'Failed to create payment session' });
    }
});

/**
 * 11. NEW ROUTE: Verify Checkout Session when user returns from Stripe
 *     This approach updates tokens if payment is successful and
 *     the user hasn't been credited yet (in case the webhook didn't run).
 */
app.get('/verify-checkout-session', authMiddleware, async (req, res) => {
    const sessionId = req.query.session_id;
    if (!sessionId) {
        return res.status(400).json({ error: 'Missing session_id' });
    }

    try {
        // 1) Retrieve the Checkout Session
        const session = await stripe.checkout.sessions.retrieve(sessionId);

        // 2) Check if payment is completed
        if (session.payment_status !== 'paid') {
            return res.status(400).json({ error: 'Payment not completed' });
        }

        // 3) Check if this payment was already processed
        const existing = db.prepare(`
      SELECT 1 FROM token_purchases WHERE stripe_payment_id = ?
    `).get(session.payment_intent);

        if (existing) {
            // Already credited tokens for this session
            return res.json({ message: 'Tokens already updated for this session' });
        }

        // 4) Otherwise, update user tokens
        db.transaction(() => {
            // Update the user's token balance
            const updateStmt = db.prepare(`
        UPDATE users
        SET tokens = tokens + ?
        WHERE id = ?
      `);
            const result = updateStmt.run(
                parseInt(session.metadata.tokenAmount),
                parseInt(session.metadata.userId)
            );
            if (result.changes === 0) {
                throw new Error('Failed to update user tokens');
            }

            // Record the purchase in token_purchases
            const purchaseStmt = db.prepare(`
        INSERT INTO token_purchases (
          user_id,
          amount,
          price,
          stripe_payment_id
        )
        VALUES (?, ?, ?, ?)
      `);

            purchaseStmt.run(
                session.metadata.userId,
                session.metadata.tokenAmount,
                session.amount_total / 100,
                session.payment_intent
            );
        })();

        return res.json({
            success: true,
            message: 'Tokens updated successfully'
        });
    } catch (error) {
        console.error('Error verifying checkout session:', error);
        return res.status(500).json({ error: 'Server error verifying checkout session' });
    }
});

// 12. Upload route (deduct 1 token on each upload)
app.post('/upload', [authMiddleware, upload.single('image')], async (req, res) => {
    if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded or invalid file type.' });
    }

    // Check user tokens
    const user = db.prepare('SELECT tokens FROM users WHERE id = ?').get(req.user.userId);
    if (!user || user.tokens <= 0) {
        return res.status(403).json({
            error: 'Insufficient tokens. Please purchase more tokens to continue.',
            tokenRequired: true
        });
    }

    try {
        // Read file -> Convert to base64
        const imagePath = path.join(__dirname, 'uploads', req.file.filename);
        const imageData = fs.readFileSync(imagePath);
        const base64Image = imageData.toString('base64');

        // Call OpenAI
        const response = await openai.chat.completions.create({
            model: 'gpt-4o',
            messages: [
                {
                    role: 'user',
                    content: [
                        {
                            type: 'text',
                            text: "Please analyse the following medical document. If it's not a medical document, refuse and say 'Please provide a medical file'. (do not rush, read the carefuly, to see if it is medical or not!) Otherwise, provide a detailed report with recommendations."
                        },
                        {
                            type: 'image_url',
                            image_url: {
                                url: `data:${req.file.mimetype};base64,${base64Image}`
                            }
                        }
                    ]
                }
            ],
            max_tokens: 1000
        });

        const description = response.choices[0].message.content.trim();
        const fileUrl = `${req.protocol}://${req.get('host')}/uploads/${req.file.filename}`;

        // Deduct 1 token & record analysis
        db.transaction(() => {
            const updateResult = db.prepare(`
        UPDATE users 
        SET tokens = tokens - 1
        WHERE id = ?
      `).run(req.user.userId);

            if (updateResult.changes === 0) {
                throw new Error('Failed to deduct token');
            }

            const stmt = db.prepare(`
        INSERT INTO analysis_records (
          user_id, 
          original_filename, 
          stored_filename, 
          analysis_text
        )
        VALUES (?, ?, ?, ?)
      `);

            stmt.run(req.user.userId, req.file.originalname, req.file.filename, description);
        })();

        res.json({
            message: 'Image uploaded and processed successfully!',
            filePath: fileUrl,
            description: description,
            remainingTokens: user.tokens - 1
        });
    } catch (error) {
        console.error('Error processing image:', error.response ? error.response.data : error.message);
        res.status(500).json({ error: 'Failed to process image.' });
    }
});

// 13. Serve static uploads
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// 14. Error handling
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ error: 'Something broke!' });
});

// 15. Start server
const PORT = 5000;
app.listen(PORT, () => {
    console.log(`Backend server is running on http://localhost:${PORT}`);
});
