const registration = async (req, res) => {
    res.send("registration");
};

const login = async (req, res) => {
    res.send("login");
};

const logout = async (req, res) =>{
    res.send("logout")
}
module.exports = {
    registration,
    login,
    logout
}