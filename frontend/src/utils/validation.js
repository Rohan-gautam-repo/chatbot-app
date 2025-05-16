export function validateUsername(username) {
    const usernameRegex = /^[A-Z][A-Za-z0-9]{0,30}$/;
    return usernameRegex.test(username);
  }
  
  export function validatePassword(password) {
    const passwordRegex = /^[A-Z](?=.*[0-9])(?=.*[!@#$%^&*])[A-Za-z0-9!@#$%^&*]{7,9}$/;
    return passwordRegex.test(password);
  }
  