function checkTempAPIToken(req, res, next) {
    const token =  req.headers.authorization.replace("Bearer ","");
    if(!token || token != process.env.TEMPORARY_API_TOKEN){
        return res.status(401).json({message: "Unauthorized User"});
    }
    next();
    // look up the user based on the token
    // const user = getUserFromToken(token).then(user => {
    //   // append the user object the the request object
    //   req.user = user;
  
    //   // call next middleware in the stack
    //   next();
    // });
  };

  module.exports = checkTempAPIToken;