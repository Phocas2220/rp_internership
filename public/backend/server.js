const express = require('express');
const mysql = require('mysql2'); // Ensure this is mysql2 for promise support
const bcrypt = require('bcrypt');
const cors = require('cors');
const bodyParser = require('body-parser');
const multer = require('multer');
const path = require('path');
const fs = require('fs'); // For file system operations (e.g., deleting orphaned files)

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(express.json()); // This is often redundant if bodyParser.json() is used, but harmless.

// Serve static files from the 'uploads' directory
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// MySQL Connection Pool (***CHANGED FROM createConnection to createPool***)
const db = mysql.createPool({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'elearning',
    waitForConnections: true, // Ensures the pool waits for connections to become available
    connectionLimit: 10, // Max number of concurrent connections
    queueLimit: 0        // Unlimited queue for connection requests
});

// Test DB connection (***ADJUSTED FOR POOL***)
db.getConnection((err, connection) => {
    if (err) {
        console.error('Error connecting to MySQL database pool:', err.message);
        // It's critical to exit if the DB connection fails at startup
        process.exit(1);
    }
    console.log('Connected to MySQL database pool!');
    connection.release(); // Release the connection back to the pool
});

// ============================
// MULTER SETUP FOR FILE UPLOADS
// ============================

// Configure storage for Multer
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/');
    },
    filename: (req, file, cb) => {
        cb(null, file.fieldname + '-' + Date.now() + path.extname(file.originalname));
    }
});

const upload = multer({ storage: storage });

// ============================
// 🔐 USER AUTHENTICATION ROUTES
// ============================

// 🟢 REGISTER
app.post('/registration', async (req, res) => {
    const { firstname, lastname, username, email, password, role } = req.body;
    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        // Using db.promise().query() directly for simple queries is fine with a pool
        const [results] = await db.promise().query(
            'INSERT INTO registration (firstname, lastname, username, email, password, role) VALUES (?, ?, ?, ?, ?, ?)',
            [firstname, lastname, username, email, hashedPassword, role]
        );
        res.status(200).send({ message: 'Registration successful' });
    } catch (err) {
        console.error('Registration error:', err);
        if (err.code === 'ER_DUP_ENTRY') {
            return res.status(409).send({ error: 'Username or Email already exists.' });
        }
        res.status(500).send({ error: 'Registration failed due to server error.' });
    }
});

// 🟡 LOGIN - MODIFIED to return user ID
app.post('/login', async (req, res) => {
    const { username, password } = req.body;
    try {
        // Using db.promise().query() works seamlessly with a pool for simple queries
        const [results] = await db.promise().query(
            'SELECT * FROM registration WHERE username = ?',
            [username]
        );

        if (results.length === 0) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        const user = results[0];
        const passwordMatch = await bcrypt.compare(password, user.password);

        if (passwordMatch) {
            res.json({ username: user.username, role: user.role, id: user.id });
        } else {
            res.status(401).json({ error: 'Invalid credentials' });
        }
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: 'Internal server error during login.' });
    }
});

// 🔵 RESET PASSWORD
app.post('/reset', (req, res) => {
    const { email } = req.body;
    // Using db.query() directly with a pool is also fine for simple queries
    const sql = 'SELECT * FROM registration WHERE email = ?';
    db.query(sql, [email], (err, results) => {
        if (err) {
            console.error('Reset password error:', err);
            return res.status(500).send({ error: 'Internal server error during password reset check.' });
        }
        if (results.length === 0) {
            return res.status(404).send({ error: 'Email not found' });
        }

        res.status(200).send({ message: 'If the email exists, a password reset link has been sent (mocked).' });
    });
});

// ✅ GET Lecturers
app.get('/api/lecturers', (req, res) => {
    const sql = "SELECT id, firstname, lastname FROM registration WHERE role = 'lecturer'";
    db.query(sql, (err, results) => {
        if (err) {
            console.error('Fetch lecturers error:', err);
            return res.status(500).send({ error: 'Failed to fetch lecturers' });
        }
        res.status(200).send(results);
    });
});


// ============================
// 📦 MODULE MANAGEMENT ROUTES
// ============================

app.post('/api/modules', (req, res) => {
    const { title, description, published, lecturer_id } = req.body;
    const sql = 'INSERT INTO modules (title, description, published, lecturer_id) VALUES (?, ?, ?, ?)';
    db.query(sql, [title, description, published, lecturer_id], (err) => {
        if (err) {
            console.error('Create module error:', err);
            return res.status(500).send({ error: 'Failed to create module' });
        }
        res.status(201).send({ message: 'Module created successfully' });
    });
});

app.get('/api/modules', (req, res) => {
    const lecturerId = req.query.lecturerId;

    let sql = `
        SELECT
            m.id,
            m.title,
            m.description,
            m.published,
            m.lecturer_id,
            CONCAT(r.firstname, ' ', r.lastname) AS lecturer_name
        FROM modules m
        LEFT JOIN registration r ON m.lecturer_id = r.id
    `;
    const params = [];

    if (lecturerId) {
        sql += ` WHERE m.lecturer_id = ?`;
        params.push(lecturerId);
    }

    sql += ` ORDER BY m.id ASC`;

    db.query(sql, params, (err, results) => {
        if (err) {
            console.error('Fetch modules error:', err);
            return res.status(500).send({ error: 'Failed to fetch modules' });
        }
        res.status(200).send(results);
    });
});

app.put('/api/modules/:id', (req, res) => {
    const { title, description, published, lecturer_id } = req.body;
    const sql = 'UPDATE modules SET title = ?, description = ?, published = ?, lecturer_id = ? WHERE id = ?';
    db.query(sql, [title, description, published, lecturer_id, req.params.id], (err) => {
        if (err) {
            console.error('Update module error:', err);
            return res.status(500).send({ error: 'Failed to update module' });
        }
        res.status(200).send({ message: 'Module updated successfully' });
    });
});

app.delete('/api/modules/:id', (req, res) => {
    const sql = 'DELETE FROM modules WHERE id = ?';
    db.query(sql, [req.params.id], (err) => {
        if (err) {
            console.error('Delete module error:', err);
            return res.status(500).send({ error: 'Failed to delete module'} );
        }
        res.status(200).send({ message: 'Module deleted successfully' });
    });
});

app.patch('/api/modules/:id/publish', (req, res) => {
    const { published } = req.body;
    const sql = 'UPDATE modules SET published = ? WHERE id = ?';
    db.query(sql, [published, req.params.id], (err) => {
        if (err) {
            console.error('Toggle publish error:', err);
            return res.status(500).send({ error: 'Failed to update publish status' });
        }
        res.status(200).send({ message: 'Module publish status updated' });
    });
});

// ============================
// ⬆️ CONTENT UPLOAD & MANAGEMENT ROUTES
// ============================

// POST endpoint for uploading module content - MODIFIED to set initial display_order
app.post('/api/content/upload', upload.single('contentFile'), async (req, res) => {
    if (!req.file) {
        return res.status(400).send({ error: 'No file uploaded.' });
    }

    const { module_id, title, description, content_type } = req.body;

    if (!module_id || !title || !content_type) {
        fs.unlink(req.file.path, (err) => {
            if (err) console.error('Error deleting orphaned file:', err);
        });
        return res.status(400).send({ error: 'Module ID, title, and content type are required.' });
    }

    let determinedContentType = content_type;
    if (!determinedContentType) {
        if (req.file.mimetype.startsWith('video/')) determinedContentType = 'video';
        else if (req.file.mimetype === 'application/pdf') determinedContentType = 'pdf';
        else if (req.file.mimetype.startsWith('image/')) determinedContentType = 'image';
        else if (req.file.mimetype === 'application/vnd.openxmlformats-officedocument.presentationml.presentation' || req.file.mimetype === 'application/vnd.ms-powerpoint') determinedContentType = 'presentation';
        else determinedContentType = 'other';
    }

    const filePath = `/uploads/${req.file.filename}`;
    const originalFilename = req.file.originalname;

    let connection; // Declare connection outside try block for finally block access
    try {
        connection = await db.promise().getConnection(); // Get a connection from the pool for transactions
        await connection.beginTransaction();

        // Get the current max display_order for this module
        const [maxOrderResult] = await connection.query( // Using connection.query within transaction
            'SELECT MAX(display_order) AS max_order FROM module_contents WHERE module_id = ?',
            [module_id]
        );
        const newDisplayOrder = (maxOrderResult[0].max_order || 0) + 1; // Set new content at the end

        const sql = `
            INSERT INTO module_contents (module_id, content_type, title, description, file_path, original_filename, display_order)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        `;
        const params = [module_id, determinedContentType, title, description, filePath, originalFilename, newDisplayOrder];

        const [result] = await connection.query(sql, params); // Using connection.query within transaction

        await connection.commit(); // Commit the transaction
        res.status(201).send({
            message: 'Content uploaded and saved successfully!',
            contentId: result.insertId,
            filePath: filePath,
            originalFilename: originalFilename,
            displayOrder: newDisplayOrder // Return the set display order
        });
    } catch (err) {
        if (connection) {
            await connection.rollback(); // Rollback on error
        }
        console.error('Database insertion error for content:', err);
        if (req.file) { // Only try to unlink if a file was actually uploaded
            fs.unlink(req.file.path, (unlinkErr) => {
                if (unlinkErr) console.error('Error deleting uploaded file after DB error:', unlinkErr);
            });
        }
        return res.status(500).send({ error: 'Failed to save content details to database.' });
    } finally {
        if (connection) {
            connection.release(); // Release the connection back to the pool
        }
    }
});

// GET endpoint to fetch module content - MODIFIED to order by display_order
app.get('/api/modules/:moduleId/contents', (req, res) => {
    const moduleId = req.params.moduleId;
    const sql = `
        SELECT id, content_type, title, description, file_path, original_filename, display_order
        FROM module_contents
        WHERE module_id = ?
        ORDER BY display_order ASC;
    `;
    db.query(sql, [moduleId], (err, results) => {
        if (err) {
            console.error('Failed to fetch module contents:', err);
            return res.status(500).send({ error: 'Failed to fetch module contents' });
        }
        res.status(200).send(results);
    });
});

// NEW PATCH endpoint to reorder module content
app.patch('/api/content/reorder', async (req, res) => {
    const { contentUpdates } = req.body; // Expects an array like [{ id: 1, display_order: 1 }, { id: 2, display_order: 2 }]

    if (!Array.isArray(contentUpdates) || contentUpdates.length === 0) {
        return res.status(400).send({ error: 'Invalid content updates array provided.' });
    }

    let connection;
    try {
        connection = await db.promise().getConnection(); // Get a connection from the pool
        await connection.beginTransaction(); // Start a transaction

        for (const item of contentUpdates) {
            if (typeof item.id === 'number' && typeof item.display_order === 'number') {
                const sql = 'UPDATE module_contents SET display_order = ? WHERE id = ?';
                await connection.query(sql, [item.display_order, item.id]); // Use connection.query within transaction
            } else {
                throw new Error('Invalid item format in contentUpdates array.');
            }
        }

        await connection.commit(); // Commit the transaction
        res.status(200).send({ message: 'Content order updated successfully!' });
    } catch (error) {
        if (connection) {
            await connection.rollback(); // Rollback on error
        }
        console.error('Failed to reorder content:', error);
        res.status(500).send({ error: 'Failed to reorder content due to a server error.' });
    } finally {
        if (connection) {
            connection.release(); // Release the connection back to the pool
        }
    }
});


// ============================
// 📚 QUIZ MANAGEMENT ROUTES (NEW)
// ============================

// POST endpoint to create a new quiz with questions and options
app.post('/api/quizzes', async (req, res) => {
    const { module_id, title, description, duration_minutes, pass_percentage, questions } = req.body;

    if (!module_id || !title || !questions || !Array.isArray(questions) || questions.length === 0) {
        return res.status(400).send({ error: 'Module ID, title, and at least one question are required.' });
    }

    let connection;
    try {
        connection = await db.promise().getConnection(); // Get a connection from the pool
        await connection.beginTransaction(); // Start a transaction

        // 1. Insert into quizzes table
        const [quizResult] = await connection.query(
            'INSERT INTO quizzes (module_id, title, description, duration_minutes, pass_percentage) VALUES (?, ?, ?, ?, ?)',
            [module_id, title, description, duration_minutes, pass_percentage]
        );
        const quizId = quizResult.insertId;

        // 2. Insert questions and their options
        for (let i = 0; i < questions.length; i++) {
            const question = questions[i];
            if (!question.question_text) {
                throw new Error(`Question ${i + 1} text is missing.`);
            }

            const [questionResult] = await connection.query(
                'INSERT INTO questions (quiz_id, question_text, question_type, display_order) VALUES (?, ?, ?, ?)',
                [quizId, question.question_text, question.question_type || 'multiple_choice', i]
            );
            const questionId = questionResult.insertId;

            // Handle options for multiple_choice questions
            if (question.question_type === 'multiple_choice' && question.options && Array.isArray(question.options)) {
                if (question.options.length < 2) {
                    throw new Error(`Question ${i + 1} must have at least two options.`);
                }
                const hasCorrectOption = question.options.some(opt => opt.is_correct);
                if (!hasCorrectOption) {
                    throw new Error(`Question ${i + 1} must have at least one correct option.`);
                }

                for (const option of question.options) {
                    if (!option.option_text) {
                        throw new Error(`Option text missing for question ${i + 1}.`);
                    }
                    await connection.query(
                        'INSERT INTO options (question_id, option_text, is_correct) VALUES (?, ?, ?)',
                        [questionId, option.option_text, option.is_correct || false]
                    );
                }
            } else if (question.question_type === 'true_false') {
                // For true/false, ensure specific options are implicitly handled or validated
                const isTrueCorrect = question.is_true_correct; // Assume frontend sends this for true/false
                if (isTrueCorrect === undefined || isTrueCorrect === null) {
                    throw new Error(`Question ${i + 1}: True/False question must specify which answer is correct.`);
                }
                await connection.query(
                    'INSERT INTO options (question_id, option_text, is_correct) VALUES (?, ?, ?)',
                    [questionId, 'True', isTrueCorrect === true]
                );
                await connection.query(
                    'INSERT INTO options (question_id, option_text, is_correct) VALUES (?, ?, ?)',
                    [questionId, 'False', isTrueCorrect === false]
                );
            }
            // short_answer questions don't have explicit options saved here,
            // as answers are free-form and validated on submission.
        }

        await connection.commit(); // Commit the transaction
        res.status(201).send({ message: 'Quiz created successfully!', quizId: quizId });

    } catch (error) {
        if (connection) {
            await connection.rollback(); // Rollback on error
        }
        console.error('Error creating quiz:', error);
        res.status(500).send({ error: error.message || 'Failed to create quiz due to a server error.' });
    } finally {
        if (connection) {
            connection.release(); // Release the connection back to the pool
        }
    }
});

// POST endpoint to submit a quiz attempt and calculate score
app.post('/api/quiz-submissions', async (req, res) => {
    const { user_id, quiz_id, answers } = req.body; // 'answers' should be an array of { question_id, submitted_answer, ... }

    if (!user_id || !quiz_id || !answers || !Array.isArray(answers)) {
        return res.status(400).send({ error: 'User ID, Quiz ID, and answers array are required.' });
    }

    let connection;
    try {
        connection = await db.promise().getConnection();
        await connection.beginTransaction();

        // 1. Fetch the quiz details and its questions/correct options
        const [quizDetailsRows] = await connection.query(
            'SELECT id, pass_percentage FROM quizzes WHERE id = ?',
            [quiz_id]
        );

        if (quizDetailsRows.length === 0) {
            throw new Error('Quiz not found.');
        }
        const quiz = quizDetailsRows[0];

        const [questionsData] = await connection.query(`
            SELECT
                q.id AS question_id,
                q.question_type,
                o.id AS option_id,
                o.option_text,
                o.is_correct
            FROM
                questions q
            LEFT JOIN
                options o ON q.id = o.question_id
            WHERE
                q.quiz_id = ?
            ORDER BY q.display_order ASC;
        `, [quiz_id]);

        const correctAnswersMap = new Map();
        const questionTypesMap = new Map();

        questionsData.forEach(row => {
            const { question_id, question_type, option_id, is_correct, option_text } = row;
            if (!correctAnswersMap.has(question_id)) {
                correctAnswersMap.set(question_id, []);
                questionTypesMap.set(question_id, question_type);
            }
            if (is_correct) {
                correctAnswersMap.get(question_id).push({ option_id, option_text });
            }
        });

        let correctCount = 0;
        let totalQuestions = 0; // Count actual questions in the quiz
        const submittedAnswersForDb = []; // To store answers for the 'quiz_answers' table

        // Calculate score
        for (const submittedAnswer of answers) {
            const { question_id, submitted_text, selected_option_id } = submittedAnswer; // assuming submitted_text for short_answer, selected_option_id for others
            totalQuestions++; // Increment total questions for each submitted answer

            const questionType = questionTypesMap.get(question_id);
            const correctOptions = correctAnswersMap.get(question_id);

            let isCorrect = false;

            if (questionType === 'multiple_choice' || questionType === 'true_false') {
                if (correctOptions && correctOptions.some(opt => opt.option_id === selected_option_id)) {
                    isCorrect = true;
                }
            } else if (questionType === 'short_answer') {
                // For short answer, you'd typically have a pre-defined correct answer in the DB.
                // For simplicity here, we'll just check if the submitted text is non-empty.
                // In a real app, you'd fetch the expected answer for validation.
                // Example: If a correct answer for question 123 was "Paris"
                // const [expectedAnswer] = await connection.query('SELECT correct_answer_text FROM questions WHERE id = ?', [question_id]);
                // if (expectedAnswer[0] && submitted_text.toLowerCase() === expectedAnswer[0].correct_answer_text.toLowerCase()) {
                //     isCorrect = true;
                // }
                if (submitted_text && submitted_text.trim() !== '') {
                    // This is a placeholder; real short-answer grading is more complex.
                    // For now, let's consider it correct if it's not empty.
                    isCorrect = true;
                }
            }

            if (isCorrect) {
                correctCount++;
            }

            // Prepare answer for database insertion
            submittedAnswersForDb.push([
                question_id,
                user_id,
                submitted_text || null, // store text for short answer
                selected_option_id || null, // store selected option for MC/TF
                isCorrect ? 1 : 0 // store if the answer was correct
            ]);
        }

        const score = totalQuestions > 0 ? (correctCount / totalQuestions) * 100 : 0;
        const passed = score >= quiz.pass_percentage;

        // 2. Insert into quiz_submissions table
        const [submissionResult] = await connection.query(
            'INSERT INTO quiz_submissions (quiz_id, user_id, score, passed) VALUES (?, ?, ?, ?)',
            [quiz_id, user_id, score, passed ? 1 : 0]
        );
        const submissionId = submissionResult.insertId;

        // 3. Insert individual answers into quiz_answers table
        if (submittedAnswersForDb.length > 0) {
            const answersSql = 'INSERT INTO quiz_answers (question_id, submission_id, user_id, submitted_text, selected_option_id, is_correct) VALUES ?';
            const answersWithSubmissionId = submittedAnswersForDb.map(ans => [ans[0], submissionId, ans[1], ans[2], ans[3], ans[4]]);
            await connection.query(answersSql, [answersWithSubmissionId]);
        }

        // 4. If passed, mark module as completed in enrollments table
        if (passed) {
            // Get module_id from quiz_id
            const [moduleResult] = await connection.query('SELECT module_id FROM quizzes WHERE id = ?', [quiz_id]);
            if (moduleResult.length > 0) {
                const moduleId = moduleResult[0].module_id;
                await connection.query(
                    'UPDATE enrollments SET completed = 1 WHERE user_id = ? AND module_id = ?',
                    [user_id, moduleId]
                );
            }
        }

        await connection.commit();
        res.status(200).send({
            message: 'Quiz submitted successfully!',
            submissionId,
            score,
            passed,
            correctCount,
            totalQuestions
        });

    } catch (error) {
        if (connection) {
            await connection.rollback();
        }
        console.error('Error submitting quiz:', error);
        res.status(500).send({ error: error.message || 'Failed to submit quiz due to a server error.' });
    } finally {
        if (connection) {
            connection.release();
        }
    }
});

// GET endpoint to fetch all quizzes for a specific module
app.get('/api/modules/:moduleId/quizzes', (req, res) => {
    const moduleId = req.params.moduleId;
    const sql = `
        SELECT id, title, description, duration_minutes, pass_percentage, created_at
        FROM quizzes
        WHERE module_id = ?
        ORDER BY created_at DESC
    `;
    db.query(sql, [moduleId], (err, results) => { // This can stay as db.query()
        if (err) {
            console.error('Failed to fetch quizzes for module:', err);
            return res.status(500).send({ error: 'Failed to fetch quizzes' });
        }
        res.status(200).send(results);
    });
});

// GET endpoint to fetch a single quiz by ID, including its questions and options
app.get('/api/quizzes/:quizId', async (req, res) => {
    const quizId = req.params.quizId;
    let connection;

    try {
        connection = await db.promise().getConnection();
        await connection.beginTransaction();

        // 1. Fetch quiz details
        const [quizRows] = await connection.query(
            'SELECT id, module_id, title, description, duration_minutes, pass_percentage, created_at, updated_at FROM quizzes WHERE id = ?',
            [quizId]
        );

        if (quizRows.length === 0) {
            await connection.rollback();
            connection.release();
            return res.status(404).send({ error: 'Quiz not found.' });
        }

        const quiz = quizRows[0];
        quiz.questions = [];

        // 2. Fetch questions for the quiz
        const [questionRows] = await connection.query(
            'SELECT id, question_text, question_type, display_order FROM questions WHERE quiz_id = ? ORDER BY display_order ASC',
            [quizId]
        );

        for (const q of questionRows) {
            const question = { ...q, options: [] };

            // 3. Fetch options for each question (if applicable)
            if (q.question_type === 'multiple_choice' || q.question_type === 'true_false') {
                const [optionRows] = await connection.query(
                    'SELECT id, option_text, is_correct FROM options WHERE question_id = ?',
                    [q.id]
                );
                question.options = optionRows;

                // For true/false, determine the `is_true_correct` flag for frontend convenience
                if (q.question_type === 'true_false') {
                    const trueOption = optionRows.find(opt => opt.option_text === 'True');
                    question.is_true_correct = trueOption ? trueOption.is_correct : null;
                }
            }
            quiz.questions.push(question);
        }

        await connection.commit();
        connection.release();
        res.status(200).send(quiz);

    } catch (error) {
        if (connection) {
            await connection.rollback();
            connection.release();
        }
        console.error('Error fetching quiz details:', error);
        res.status(500).send({ error: 'Failed to fetch quiz details due to a server error.' });
    }
});

// DELETE endpoint to delete a quiz by ID
app.delete('/api/quizzes/:quizId', (req, res) => {
    const quizId = req.params.quizId;
    const sql = 'DELETE FROM quizzes WHERE id = ?';
    db.query(sql, [quizId], (err, result) => {
        if (err) {
            console.error('Error deleting quiz:', err);
            return res.status(500).send({ error: 'Failed to delete quiz.' });
        }
        if (result.affectedRows === 0) {
            return res.status(404).send({ error: 'Quiz not found.' });
        }
        // Due to ON DELETE CASCADE, associated questions and options will also be deleted.
        res.status(200).send({ message: 'Quiz deleted successfully!' });
    });
});

// GET endpoint to fetch questions for a specific quiz
app.get('/api/quizzes/:quizId/questions', async (req, res) => {
    const quizId = req.params.quizId;
    try {
        const sql = `
            SELECT
                id,
                question_text,
                question_type,
                display_order
            FROM
                questions
            WHERE
                quiz_id = ?
            ORDER BY
                display_order ASC;
        `;
        const [questions] = await db.promise().query(sql, [quizId]);

        // Fetch options for multiple-choice and true/false questions
        for (const question of questions) {
            if (question.question_type === 'multiple_choice' || question.question_type === 'true_false') {
                const [options] = await db.promise().query(
                    'SELECT id, option_text, is_correct FROM options WHERE question_id = ?',
                    [question.id]
                );
                question.options = options;
            }
        }
        res.status(200).json(questions);
    } catch (error) {
        console.error('Error fetching quiz questions:', error);
        res.status(500).json({ error: 'Failed to fetch quiz questions' });
    }
});


// ============================
// 👥 USER MANAGEMENT ROUTES
// ============================

app.get('/api/users', (req, res) => {
    const sql = 'SELECT id, firstname, lastname, username, email, role, active FROM registration';
    db.query(sql, (err, results) => {
        if (err) {
            console.error('Fetch users error:', err);
            return res.status(500).send({ error: 'Failed to fetch users' });
        }
        res.status(200).send(results);
    });
});

// Promote user to lecturer (kept for backward compatibility with older UI if needed, but 'update-role' is preferred)
app.patch('/api/users/:id/promote', (req, res) => {
    const userId = req.params.id;
    const sql = 'UPDATE registration SET role = ? WHERE id = ?';
    db.query(sql, ['lecturer', userId], (err) => {
        if (err) {
            console.error('Promote user error:', err);
            return res.status(500).send({ error: 'Failed to promote user' });
        }
        res.status(200).send({ message: 'User promoted to lecturer' });
    });
});

// Promote to administrator (kept for backward compatibility with older UI if needed)
app.patch('/api/users/:id/make-admin', (req, res) => {
    const userId = req.params.id;
    const sql = 'UPDATE registration SET role = ? WHERE id = ?';
    db.query(sql, ['administrator', userId], (err) => {
        if (err) {
            console.error('Make admin error:', err);
            return res.status(500).send({ error: 'Failed to promote user to administrator' });
        }
        res.status(200).send({ message: 'User promoted to administrator' });
    });
});

// ✅ NEW ENDPOINT: Update User Role (flexible demotion/promotion)
app.patch('/api/users/:id/update-role', (req, res) => {
    const userId = req.params.id;
    const { role } = req.body;

    if (!role) {
        return res.status(400).send({ error: 'New role is required.' });
    }

    const allowedRoles = ['learner', 'lecturer', 'administrator'];
    if (!allowedRoles.includes(role)) {
        return res.status(400).send({ error: 'Invalid role specified.' });
    }

    const sql = 'UPDATE registration SET role = ? WHERE id = ?';
    db.query(sql, [role, userId], (err) => {
        if (err) {
            console.error('Update user role error:', err);
            return res.status(500).send({ error: 'Failed to update user role.' });
        }
        res.status(200).send({ message: `User role updated to ${role}.` });
    });
});


app.patch('/api/users/:id/toggle-active', (req, res) => {
    const userId = req.params.id;
    db.query('SELECT active FROM registration WHERE id = ?', [userId], (err, results) => {
        if (err || results.length === 0) {
            console.error('User active status fetch error:', err);
            return res.status(500).send({ error: 'Failed to fetch user status' });
        }
        const currentStatus = results[0].active;
        const newStatus = currentStatus === 1 ? 0 : 1;
        db.query('UPDATE registration SET active = ? WHERE id = ?', [newStatus, userId], (err2) => {
            if (err2) {
                console.error('Toggle active status error:', err2);
                return res.status(500).send({ error: 'Failed to update user status' });
            }
            res.status(200).send({ message: `User has been ${newStatus ? 'enabled' : 'disabled'}` });
        });
    });
});

app.delete('/api/users/:id', (req, res) => {
    const userId = req.params.id;
    const sql = 'DELETE FROM registration WHERE id = ?';
    db.query(sql, [userId], (err) => {
        if (err) {
            console.error('Delete user error:', err);
            return res.status(500).send({ error: 'Failed to delete user' });
        }
        res.status(200).send({ message: 'User deleted successfully' });
    });
});

// ============================
// 🧑‍🎓 LEARNER MONITORING ROUTES (NEW)
// ============================

// GET endpoint to fetch learners enrolled in a specific module
// Includes basic progress (enrollment date, completed status)
app.get('/api/lecturer/modules/:moduleId/learners', async (req, res) => {
    const moduleId = req.params.moduleId;

    if (!moduleId) {
        return res.status(400).send({ error: 'Module ID is required.' });
    }

    try {
        const sql = `
            SELECT
                e.id AS enrollment_id,
                e.user_id,
                r.firstname,
                r.lastname,
                r.username,
                r.email,
                e.enrolled_at,
                e.completed
            FROM enrollments e
            JOIN registration r ON e.user_id = r.id
            WHERE e.module_id = ?
            ORDER BY r.lastname, r.firstname ASC;
        `;
        // Using db.promise().query() for consistency with other new routes
        const [learners] = await db.promise().query(sql, [moduleId]);

        if (learners.length === 0) {
            return res.status(404).send({ message: 'No learners found for this module or module does not exist.' });
        }

        res.status(200).send(learners);
    } catch (error) {
        console.error('Error fetching enrolled learners:', error);
        res.status(500).send({ error: 'Failed to fetch enrolled learners due to a server error.' });
    }
});

// ============================
// 📊 SYSTEM REPORT ROUTES
// ============================

app.get('/api/reports/enrollments', (req, res) => {
    const sql = `
        SELECT
            m.id AS moduleId,
            m.title,
            COUNT(e.id) AS total_enrollments
        FROM modules m
        LEFT JOIN enrollments e ON m.id = e.module_id
        GROUP BY m.id, m.title
        ORDER BY total_enrollments DESC
    `;
    db.query(sql, (err, results) => {
        if (err) {
            console.error('Enrollment stats error:', err);
            return res.status(500).send({ error: 'Failed to fetch enrollment statistics' });
        }
        res.status(200).send(results);
    });
});

app.get('/api/reports/revenue', (req, res) => {
    const sql = `
        SELECT
            m.id AS moduleId,
            m.title,
            COALESCE(SUM(p.amount), 0) AS total_revenue
        FROM modules m
        LEFT JOIN payments p ON m.id = p.module_id
        GROUP BY m.id, m.title
        ORDER BY total_revenue DESC
    `;
    db.query(sql, (err, results) => {
        if (err) {
            console.error('Revenue stats error:', err);
            return res.status(500).send({ error: 'Failed to fetch revenue statistics' });
        }
        res.status(200).send(results);
    });
});

app.get('/api/reports/completion', (req, res) => {
    const sql = `
        SELECT
            m.id AS moduleId,
            m.title,
            COUNT(e.id) AS total_enrollments,
            SUM(CASE WHEN e.completed = 1 THEN 1 ELSE 0 END) AS completed_count,
            ROUND(SUM(CASE WHEN e.completed = 1 THEN 1 ELSE 0 END) / COUNT(e.id) * 100, 2) AS completion_rate
        FROM modules m
        LEFT JOIN enrollments e ON m.id = e.module_id
        GROUP BY m.id, m.title
        ORDER BY completion_rate DESC
    `;
    db.query(sql, (err, results) => {
        if (err) {
            console.error('Completion stats error:', err);
            return res.status(500).send({ error: 'Failed to fetch module completion rates' });
        }
        res.status(200).send(results);
    });
});

// ============================
// 📚 ENROLLMENT ROUTES (NEW - for Learner Dashboard)
// ============================

// GET endpoint to fetch modules a specific learner is enrolled in
app.get('/api/learners/:learnerId/enrolled-modules', async (req, res) => {
    const learnerId = req.params.learnerId;

    if (!learnerId) {
        return res.status(400).send({ error: 'Learner ID is required.' });
    }

    try {
        const sql = `
            SELECT
                m.id,
                m.title,
                m.description,
                m.published,
                m.lecturer_id,
                CONCAT(r.firstname, ' ', r.lastname) AS lecturer_name,
                e.enrolled_at,
                e.completed AS is_completed_by_learner
            FROM enrollments e
            JOIN modules m ON e.module_id = m.id
            LEFT JOIN registration r ON m.lecturer_id = r.id
            WHERE e.user_id = ?
            ORDER BY e.enrolled_at DESC;
        `;
        const [enrolledModules] = await db.promise().query(sql, [learnerId]);

        if (enrolledModules.length === 0) {
            return res.status(200).send({ message: 'No modules enrolled by this learner.', modules: [] }); // Return empty array instead of 404
        }

        res.status(200).send(enrolledModules);
    } catch (error) {
        console.error('Error fetching enrolled modules for learner:', error);
        res.status(500).send({ error: 'Failed to fetch enrolled modules due to a server error.' });
    }
});

// POST endpoint for a learner to enroll in a module
app.post('/api/enrollments', async (req, res) => {
    const { user_id, module_id } = req.body;

    if (!user_id || !module_id) {
        return res.status(400).send({ error: 'User ID and Module ID are required for enrollment.' });
    }

    try {
        // Check if already enrolled
        const [existingEnrollment] = await db.promise().query(
            'SELECT id FROM enrollments WHERE user_id = ? AND module_id = ?',
            [user_id, module_id]
        );

        if (existingEnrollment.length > 0) {
            return res.status(409).send({ message: 'Learner is already enrolled in this module.' });
        }

        const [result] = await db.promise().query(
            'INSERT INTO enrollments (user_id, module_id) VALUES (?, ?)',
            [user_id, module_id]
        );
        res.status(201).send({ message: 'Enrollment successful!', enrollmentId: result.insertId });
    } catch (error) {
        console.error('Enrollment error:', error);
        res.status(500).send({ error: 'Failed to enroll in module due to a server error.' });
    }
});

// PATCH endpoint to mark a module as completed for a learner
app.patch('/api/enrollments/:enrollmentId/complete', async (req, res) => {
    const enrollmentId = req.params.enrollmentId;
    // You might want to get user_id from token/session to ensure only the enrolled user can mark complete
    // For now, assuming direct access based on enrollmentId
    const { completed } = req.body; // Expects true/false or 1/0

    try {
        const [result] = await db.promise().query(
            'UPDATE enrollments SET completed = ?, completed_at = NOW() WHERE id = ?',
            [completed ? 1 : 0, enrollmentId]
        );

        if (result.affectedRows === 0) {
            return res.status(404).send({ error: 'Enrollment not found.' });
        }
        res.status(200).send({ message: `Module ${completed ? 'marked as completed' : 'unmarked as completed'}.` });
    } catch (error) {
        console.error('Error updating enrollment completion status:', error);
        res.status(500).send({ error: 'Failed to update module completion status.' });
    }
});

// ============================
// 🚀 START SERVER
// ============================

const server = app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});

server.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
        console.error(`Port ${PORT} is already in use. Please free the port or use a different one.`);
        process.exit(1);
    } else {
        console.error('Server error:', err);
    }
});