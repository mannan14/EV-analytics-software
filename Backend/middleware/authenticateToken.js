const { CognitoJwtVerifier } = require("aws-jwt-verify");

const verifier = CognitoJwtVerifier.create({
  userPoolId: process.env.COGNITO_USERPOOL_ID,
  tokenUse: "id",
  clientId: process.env.COGNITO_CLIENT_ID,
});

async function authenticateToken(req, res, next) {
  try {
    const token = req.headers.authorization;

    if (!token) {
      return res
        .status(401)
        .json({ message: "Unauthorized: Token is missing" });
    }

    const tokenParts = token.split(" ");

    if (tokenParts.length !== 2 || tokenParts[0] !== "Bearer") {
      return res
        .status(401)
        .json({ message: "Unauthorized: Invalid token format" });
    }

    const idToken = tokenParts[1];
    const payload = await verifier.verify(idToken);
    // console.log(payload);
    // If you need to access user data in route handlers, attach it to the request
    req.authUserId = payload.sub; //sub is userId

    next(); // Continue to the next middleware or route handler
  } catch (error) {
    console.error("Token verification error:", error.message);

    return res.status(403).json({ message: "Forbidden: Invalid token" });
  }
}

module.exports = {
  authenticateToken,
};
