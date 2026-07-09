-- ============================================================
-- Seed Default Categories
-- ============================================================

INSERT INTO categories (id, name, icon, color, type, is_default) VALUES
-- Income categories
(uuid_generate_v4(), 'Salary',          'work',           '#4CAF50', 'income',  TRUE),
(uuid_generate_v4(), 'Freelance',        'laptop',         '#2196F3', 'income',  TRUE),
(uuid_generate_v4(), 'Business',         'business',       '#9C27B0', 'income',  TRUE),
(uuid_generate_v4(), 'Investments',      'trending_up',    '#FF9800', 'income',  TRUE),
(uuid_generate_v4(), 'Rental Income',    'apartment',      '#00BCD4', 'income',  TRUE),
(uuid_generate_v4(), 'Gifts',            'card_giftcard',  '#E91E63', 'income',  TRUE),
(uuid_generate_v4(), 'Other Income',     'attach_money',   '#607D8B', 'income',  TRUE),
-- Expense categories
(uuid_generate_v4(), 'Food & Dining',    'restaurant',     '#F44336', 'expense', TRUE),
(uuid_generate_v4(), 'Transport',        'directions_car', '#FF5722', 'expense', TRUE),
(uuid_generate_v4(), 'Bills & Utilities','receipt',        '#795548', 'expense', TRUE),
(uuid_generate_v4(), 'Shopping',         'shopping_bag',   '#E91E63', 'expense', TRUE),
(uuid_generate_v4(), 'Rent & Housing',   'home',           '#607D8B', 'expense', TRUE),
(uuid_generate_v4(), 'Entertainment',    'movie',          '#9C27B0', 'expense', TRUE),
(uuid_generate_v4(), 'Healthcare',       'local_hospital', '#F44336', 'expense', TRUE),
(uuid_generate_v4(), 'Education',        'school',         '#3F51B5', 'expense', TRUE),
(uuid_generate_v4(), 'Travel',           'flight',         '#00BCD4', 'expense', TRUE),
(uuid_generate_v4(), 'Savings',          'savings',        '#4CAF50', 'expense', TRUE),
(uuid_generate_v4(), 'Insurance',        'security',       '#FF9800', 'expense', TRUE),
(uuid_generate_v4(), 'Personal Care',    'spa',            '#E91E63', 'expense', TRUE),
(uuid_generate_v4(), 'Subscriptions',    'subscriptions',  '#673AB7', 'expense', TRUE),
(uuid_generate_v4(), 'Fitness',          'fitness_center', '#00BCD4', 'expense', TRUE),
(uuid_generate_v4(), 'Groceries',        'local_grocery_store', '#8BC34A', 'expense', TRUE),
(uuid_generate_v4(), 'Clothing',         'checkroom',      '#FF4081', 'expense', TRUE),
(uuid_generate_v4(), 'Charity',          'volunteer_activism', '#FF9800', 'expense', TRUE),
-- Both
(uuid_generate_v4(), 'Other',            'category',       '#9E9E9E', 'both',    TRUE)
ON CONFLICT DO NOTHING;
