// =====================================
// Validate Email
// =====================================
exports.isValidEmail = (email) => {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(email);
};

// =====================================
// Validate Phone Number (Việt Nam)
// =====================================
exports.isValidPhone = (phone) => {
    const regex = /^(03|05|07|08|09)\d{8}$/;
    return regex.test(phone);
};

// =====================================
// Validate Password
// =====================================
exports.isValidPassword = (password) => {
    const regex = /^(?=.*[A-Za-z])(?=.*\d).{6,}$/;
    return regex.test(password);
};

// =====================================
// Validate Empty
// =====================================
exports.isEmpty = (value) => {
    return (
        value === undefined ||
        value === null ||
        value.toString().trim() === ""
    );
};