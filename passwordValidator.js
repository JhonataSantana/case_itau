function isValidPassword(password) {
    if (password.length < 9) {
        return false;
    }
    if (!/[0-9]/.test(password)) {
        return false;
    }
    if (!/[a-z]/.test(password)) {
        return false;
    }
    if (!/[A-Z]/.test(password)) {
        return false;
    }
    if (!/[!@#$%^&*()-+]/.test(password)) {
        return false;
    }
    if (new Set(password).size !== password.length) {
        return false;
    }
    if (/\s/.test(password)) {
        return false;
    }
    return true;
}

module.exports = isValidPassword;
