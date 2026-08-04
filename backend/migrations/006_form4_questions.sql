-- Form 4: set paper duration to 2 hours
UPDATE contest_papers SET duration_minutes = 120 WHERE contest_id = 1 AND grade = 'Form 4';

-- Form 4: add 16 MCQs (total 20 with the existing 4)
INSERT INTO questions (contest_id, grade, question, option_a, option_b, option_c, option_d, correct_answer, marks, type, working_space) VALUES
(1, 'Form 4', 'Differentiate y = 3x^2 + 2x with respect to x.', '6x + 2', '6x', '3x + 2', '6x^2 + 2', 'A', 1, 'mcq', 240),
(1, 'Form 4', 'Integrate 2x with respect to x.', '2x^2 + C', 'x^2 + C', 'x^2', 'x + C', 'B', 1, 'mcq', 240),
(1, 'Form 4', 'Find the determinant of the matrix [[1, 2], [3, 4]].', '-2', '2', '10', '4', 'A', 1, 'mcq', 240),
(1, 'Form 4', 'If log10 x = 2, what is the value of x?', '100', '20', '1024', '10', 'A', 1, 'mcq', 240),
(1, 'Form 4', 'What is the value of sin 30 degrees?', 'sqrt(3)/2', '1/2', '1', '0', 'B', 1, 'mcq', 240),
(1, 'Form 4', 'What is the mean of 2, 4, 6 and 8?', '5', '6', '4', '7', 'A', 1, 'mcq', 240),
(1, 'Form 4', 'What is the gradient of the line y = 2x + 3?', '3', '2', '1', '2x', 'B', 1, 'mcq', 240),
(1, 'Form 4', 'The first term of an AP is 2 and the common difference is 3. What is its nth term?', '3n - 1', '3n + 2', '3n', '2n + 3', 'A', 1, 'mcq', 240),
(1, 'Form 4', 'What is the derivative of sin x?', 'cos x', '-sin x', '-cos x', 'sin x', 'A', 1, 'mcq', 240),
(1, 'Form 4', 'Simplify 2^3 x 2^2.', '32', '64', '16', '12', 'A', 1, 'mcq', 240),
(1, 'Form 4', 'What is the value of tan 45 degrees?', 'sqrt(3)', '1', '0', '1/sqrt(2)', 'B', 1, 'mcq', 240),
(1, 'Form 4', 'What is the distance between the points (0, 0) and (3, 4)?', '7', '5', '1', '12', 'B', 1, 'mcq', 240),
(1, 'Form 4', 'Solve the equation 3(x - 2) = 9.', '3', '5', '7', '11', 'B', 1, 'mcq', 240),
(1, 'Form 4', 'What is the value of cos 60 degrees?', '1/2', 'sqrt(3)/2', '1', '0', 'A', 1, 'mcq', 240),
(1, 'Form 4', 'What is the sum of interior angles of a triangle?', '180', '360', '90', '270', 'A', 1, 'mcq', 240),
(1, 'Form 4', 'Solve x^2 - 9 = 0.', '3 only', '-3 only', '3 or -3', '9', 'C', 1, 'mcq', 240);
