const Express = require("express");
const BodyParser = require("body-parser");
const CookieParser = require("cookie-parser");
const AuthHelper = require("apihelper/AuthHelper");
const Queries = require("apihelper/Queries");

const app = Express();

app.use(CookieParser());

app.use(BodyParser.urlencoded({
	limit: '10MB',
	extended: true
}));

app.use(BodyParser.json({ limit: '10MB' }));

const NODEJS_PORT = process.env.NODEJS_PORT ?? "9000";

/**
 * Perform user authentication and return a JWT token.
 */
app.post("/api/authenticate", async (req, res, next) => {
	try {
		if (!req.body?.email) { return res.status(400).send({ status: "BAD_REQUEST", errorMessage: "Please enter a valid email" }); };
		if (!req.body?.password) { return res.status(400).send({ status: "BAD_REQUEST", errorMessage: "Please enter a valid password" }); };

		let getUserDetails = await Queries.getUserDetails(req.body.email, req.body.password);
		console.log(getUserDetails);
		if (!getUserDetails || !Array.isArray(getUserDetails)) {
			return res.status(500).send({ status: "INTERNAL_SERVER_ERROR", errorMessage: "Something went wrong." });
		}
		if (getUserDetails.length < 1) {
			return res.status(401).send({ status: "USER_UNAUTHORISED", errorMessage: "User email or password is incorrect" });
		}
		let userAuthenticatedToken = AuthHelper.createJWT(getUserDetails[0]);
		if (!userAuthenticatedToken) {
			return res.status(500).send({ status: "INTERNAL_SERVER_ERROR", errorMessage: "Something went wrong." });
		}
		return res.status(200).send({ status: "SUCCESS", jwtToken: userAuthenticatedToken });
	} catch (err) {
		console.error("Error: middleware failed with error: ", err);
		return res.status(500).send({ status: "INTERNAL_SERVER_ERROR", errorMessage: "Something went wrong." });
	}
});

/**
 * Returns a post with its number of likes and comments given post id.
 */
app.get("/api/posts/:id", async (req, res, next) => {
	try {
		if (!req.params?.id || !(/^[0-9]+$/).test(req.params.id) || !parseFloat(req.params.id)) { return res.status(400).send({ status: "BAD_REQUEST", errorMessage: "Please enter a valid post id." }); };

		let getPostByIdResults = await Queries.getPostById(parseFloat(req.params.id));
		if (!getPostByIdResults || !Array.isArray(getPostByIdResults)) {
			return res.status(500).send({ status: "INTERNAL_SERVER_ERROR", errorMessage: "Something went wrong." });
		}
		if (!getPostByIdResults[0]) {
			return res.status(404).send({ status: "NOT_FOUND", errorMessage: "Could not find the post you are looking for." });
		}
		return res.status(200).send({ status: "SUCCESS", post: getPostByIdResults[0] });
	} catch (err) {
		console.error("Error: middleware failed with error: ", err);
		return res.status(500).send({ status: "INTERNAL_SERVER_ERROR", errorMessage: "Something went wrong." });
	}
});

/**
 * Middleware to authenticate users with authorization header.
 */
app.use(["/api/", "/api/*"], async (req, res, next) => {
	try {
		if (!req.headers.authorization || !AuthHelper.verifyJWT(req.headers.authorization)) { return res.status(401).send({ status: "UNAUTHORIZED", errorMessage: "The user authorization header is either missing or invalid." }); };

		const userDetails = AuthHelper.verifyJWT(req.headers.authorization);
		let getUserByIdResult = await Queries.getUserById(userDetails.id);
		if (!getUserByIdResult || !Array.isArray(getUserByIdResult)) {
			return res.status(500).send({ status: "INTERNAL_SERVER_ERROR", errorMessage: "Something went wrong." });
		}
		if (!getUserByIdResult[0]) {
			return res.status(401).send({ status: "USER_UNAUTHORISED", errorMessage: "The user authorization header is either missing or invalid." });
		}
		res.locals.userId = parseInt(getUserByIdResult[0].id);
		next();
	} catch (err) {
		console.error("Error: middleware failed with error: ", err);
		return res.status(500).send({ status: "INTERNAL_SERVER_ERROR", errorMessage: "Something went wrong." });
	}
});

/**
 * Allow a user to follow users with the given id.
 */
app.post("/api/follow/:id", async (req, res, next) => {
	try {
		if (!req.params?.id || !(/^[0-9]+$/).test(req.params.id) || !parseFloat(req.params.id)) { return res.status(400).send({ status: "BAD_REQUEST", errorMessage: "Please enter a valid user id" }); };
		if (parseFloat(req.params.id) === res.locals.userId) { return res.status(422).send({ status: "UNPROCESSABLE_ENTITY", errorMessage: "Cannot follow yourself." }); };

		let followUserResult = await Queries.followUserById(res.locals.userId, req.params.id);
		if (!followUserResult || !Array.isArray(followUserResult)) {
			return res.status(500).send({ status: "INTERNAL_SERVER_ERROR", errorMessage: "Something went wrong." });
		}
		if (!followUserResult[0]) {
			return res.status(400).send({ status: "BAD_REQUEST", errorMessage: "User trying to follow does not exists." });
		}
		return res.status(200).send({ status: "SUCCESS" });
	} catch (err) {
		console.error("Error: middleware failed with error: ", err);
		return res.status(500).send({ status: "INTERNAL_SERVER_ERROR", errorMessage: "Something went wrong." });
	}
});

/**
 * Allow user to unfollow a user with a given id.
 */
app.post("/api/unfollow/:id", async (req, res, next) => {
	try {
		if (!req.params?.id || !(/^[0-9]+$/).test(req.params.id) || !parseFloat(req.params.id)) { return res.status(400).send({ status: "BAD_REQUEST", errorMessage: "Please enter a valid user id" }); };

		let followUserResult = await Queries.unfollowUserById(res.locals.userId, req.params.id);
		if (!followUserResult || !Array.isArray(followUserResult)) {
			return res.status(500).send({ status: "INTERNAL_SERVER_ERROR", errorMessage: "Something went wrong." });
		}
		if (!followUserResult[0]) {
			return res.status(400).send({ status: "BAD_REQUEST", errorMessage: "The user does not exists or is already unfollowed." });
		}
		return res.status(200).send({ status: "SUCCESS" });
	} catch (err) {
		console.error("Error: middleware failed with error: ", err);
		return res.status(500).send({ status: "INTERNAL_SERVER_ERROR", errorMessage: "Something went wrong." });
	}
});

/**
 * Returns a user their profile.
 */
app.get("/api/user", async (req, res, next) => {
	try {
		let getUserProfileResult = await Queries.getUserProfile(res.locals.userId);
		if (!getUserProfileResult || !Array.isArray(getUserProfileResult) || !getUserProfileResult[0]) {
			return res.status(500).send({ status: "INTERNAL_SERVER_ERROR", errorMessage: "Something went wrong." });
		}
		return res.status(200).send({ status: "SUCCESS", profile: getUserProfileResult[0] });
	} catch (err) {
		console.error("Error: middleware failed with error: ", err);
		return res.status(500).send({ status: "INTERNAL_SERVER_ERROR", errorMessage: "Something went wrong." });
	}
});

/**
 * Create a new post by the user.
 */
app.post("/api/posts/", async (req, res, next) => {
	try {
		if (!req.body?.title) { return res.status(404).send({ status: "BAD_REQUEST", errorMessage: "Please enter a valid title." }); };
		if (!req.body?.content) { return res.status(404).send({ status: "BAD_REQUEST", errorMessage: "Please enter a valid content." }); };

		let addPostForUserResult = await Queries.addPostForUser(res.locals.userId, req.body.title, req.body.content);
		if (!addPostForUserResult || !Array.isArray(addPostForUserResult) || !addPostForUserResult[0]) {
			return res.status(500).send({ status: "INTERNAL_SERVER_ERROR", errorMessage: "Something went wrong." });
		}
		return res.status(200).send({ status: "SUCCESS", newPost: addPostForUserResult[0] });
	} catch (err) {
		console.error("Error: middleware failed with error: ", err);
		return res.status(500).send({ status: "INTERNAL_SERVER_ERROR", errorMessage: "Something went wrong." });
	}
});

/**
 * Delete a post made by the user.
 */
app.delete("/api/posts/:id", async (req, res, next) => {
	try {
		if (!req.params?.id || !(/^[0-9]+$/).test(req.params.id) || !parseFloat(req.params.id)) { return res.status(400).send({ status: "BAD_REQUEST", errorMessage: "Please enter a valid post id." }); };
		let deletePostByIdResult = await Queries.deletePostById(res.locals.userId, req.params.id);
		if (!deletePostByIdResult || !Array.isArray(deletePostByIdResult)) {
			return res.status(500).send({ status: "INTERNAL_SERVER_ERROR", errorMessage: "Something went wrong." });
		}
		if (!deletePostByIdResult[0]) {
			return res.status(403).send({ status: "FORBIDDEN", errorMessage: "The post does not exists or not authorised to delete." });
		}
		return res.status(200).send({ status: "SUCCESS", deletedPost: deletePostByIdResult[0] });
	} catch (err) {
		console.error("Error: middleware failed with error: ", err);
		return res.status(500).send({ status: "INTERNAL_SERVER_ERROR", errorMessage: "Something went wrong." });
	}
});

/**
 * Like a post with post id.
 */
app.post("/api/like/:id", async (req, res, next) => {
	try {
		if (!req.params?.id || !(/^[0-9]+$/).test(req.params.id) || !parseFloat(req.params.id)) { return res.status(400).send({ status: "BAD_REQUEST", errorMessage: "Please enter a valid post id." }); };

		let likePostByIdResult = await Queries.likePostById(res.locals.userId, req.params.id);
		if (!likePostByIdResult || !Array.isArray(likePostByIdResult)) {
			return res.status(500).send({ status: "INTERNAL_SERVER_ERROR", errorMessage: "Something went wrong." });
		}
		if (!likePostByIdResult[0]) {
			return res.status(400).send({ status: "BAD_REQUEST", errorMessage: "The post id does not exists." });
		}
		return res.status(200).send({ status: "SUCCESS" });
	} catch (err) {
		console.error("Error: middleware failed with error: ", err);
		return res.status(500).send({ status: "INTERNAL_SERVER_ERROR", errorMessage: "Something went wrong." });
	}
});

/**
 * Unlike a post with post id.
 */
app.post("/api/unlike/:id", async (req, res, next) => {
	try {
		if (!req.params?.id || !(/^[0-9]+$/).test(req.params.id) || !parseFloat(req.params.id)) { return res.status(400).send({ status: "BAD_REQUEST", errorMessage: "Please enter a valid post id." }); };

		let unlikePostByIdResult = await Queries.unlikePostById(res.locals.userId, req.params.id);
		if (!unlikePostByIdResult || !Array.isArray(unlikePostByIdResult)) {
			return res.status(500).send({ status: "INTERNAL_SERVER_ERROR", errorMessage: "Something went wrong." });
		}
		if (!unlikePostByIdResult[0]) {
			return res.status(400).send({ status: "BAD_REQUEST", errorMessage: "The post does not exists or already unliked." });
		}
		return res.status(200).send({ status: "SUCCESS" });
	} catch (err) {
		console.error("Error: middleware failed with error: ", err);
		return res.status(500).send({ status: "INTERNAL_SERVER_ERROR", errorMessage: "Something went wrong." });
	}
});

/**
 * Add a comment for a post with post id.
 */
app.post("/api/comment/:id", async (req, res, next) => {
	try {
		if (!req.params?.id || !(/^[0-9]+$/).test(req.params.id) || !parseFloat(req.params.id)) { return res.status(400).send({ status: "BAD_REQUEST", errorMessage: "Please enter a valid post id." }); };
		if (!req.body?.comment) { return res.status(400).send({ status: "BAD_REQUEST", errorMessage: "Comment cannot be null or undefined" }); };

		let addCommentOnPostByUserResult = await Queries.addCommentOnPostByUser(res.locals.userId, req.params.id, req.body.comment);
		if (!addCommentOnPostByUserResult || !Array.isArray(addCommentOnPostByUserResult)) {
			return res.status(500).send({ status: "INTERNAL_SERVER_ERROR", errorMessage: "Something went wrong." });
		}
		if (!addCommentOnPostByUserResult[0]) {
			return res.status(400).send({ status: "BAD_REQUEST", errorMessage: "The post id is not valid!" });
		}
		return res.status(200).send({ status: "SUCCESS", comment: addCommentOnPostByUserResult[0] });
	} catch (err) {
		console.error("Error: /api/comment/:id failed with error: ", err);
		return res.status(500).send({ status: "INTERNAL_SERVER_ERROR", errorMessage: "Something went wrong." });
	}
});

/**
 * Returns all posts by the user sorted by post time.
 */
app.get("/api/all_posts", async (req, res, next) => {
	try {
		let allPostsResult = await Queries.getAllPostsOfUser(res.locals.userId);
		if (!allPostsResult || !Array.isArray(allPostsResult)) {
			return res.status(500).send({ status: "INTERNAL_SERVER_ERROR", errorMessage: "Something went wrong." });
		}
		return res.status(200).send({ status: "SUCCESS", allPosts: allPostsResult });
	} catch (err) {
		console.error("Error: /api/all_posts failed with error: ", err);
		return res.status(500).send({ status: "INTERNAL_SERVER_ERROR", errorMessage: "Something went wrong." });
	}
});

app.listen(NODEJS_PORT, () => {
	return console.log(`Listening to requests on http://localhost:${NODEJS_PORT}`);
});
