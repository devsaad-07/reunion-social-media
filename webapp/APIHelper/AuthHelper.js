const jwt = require("jsonwebtoken");

const AuthHelper = {};

/**
 * AuthHelper function to return the expiry epoch for JWT auth.
 * @returns epochTime
 */
AuthHelper.getJWTExpiryEpoch = () => {
	return new Date().getTime() + 24 * 60 * 60 * 1000 // return an expiry of 24 hour
}

/**
 * AuthHelper function to return the JWT secret.
 * @returns jwtSecret
 */
AuthHelper.getJWTSecret = () => {
	return process.env.JWT_SECRET ?? "REUNIONSECRET1234";
}

/**
 * AuthHelper function to create a Json Web Token.
 * @param {string} jwtRequest
 * @returns jwtToken
 */
AuthHelper.createJWT = (jwtRequest) => {
	try {
		let jwtDetails = { expiryEpochTime: AuthHelper.getJWTExpiryEpoch() };
		Object.assign(jwtDetails, jwtRequest);
		return jwt.sign(jwtDetails, AuthHelper.getJWTSecret());
	} catch (err) {
		console.error("ERROR: AuthHelper.createJWT::jwt.sign failed with error: ", err);
		return;
	}
}

/**
 * AuthHelper function to authenticate a Json Web Token.
 * @param {string} jwtToken
 * @returns jwtObject
 */
AuthHelper.verifyJWT = (jwtToken) => {
	try {
		const jwtData = jwt.verify(jwtToken, AuthHelper.getJWTSecret());
		// check for return of JSON object
		if (!jwtData) {
			console.error("ERROR: AuthHelper.verifyJWT::jwt.verify failed because the token is not valid.");
			return;
		}
		// check for expiry of the JWT
		if (new Date(jwtData.expiryEpochTime) < new Date()) {
			console.error("ERROR: AuthHelper.verifyJWT::jwt.verify failed because the token has expired.");
			return;
		}
		return jwtData;
	} catch (err) {
		console.error("ERROR: AuthHelper.verifyJWT::jwt.verify failed because the token is not valid with error: ", err);
		return;
	}
}

module.exports = AuthHelper;
