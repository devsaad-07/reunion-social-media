const PGUtils = require("./PGUtils");

const Queries = {};

/**
 * Query to get user by id.
 * @param {number} userId
 * @returns {array}
 */
Queries.getUserById = async (userId) => {
	let getUserByIdQueryText = `
		SELECT id, userName, email
		FROM public.reunion_users
		WHERE id = ${userId}
	;`;

	let err, getUserByIdResult = await PGUtils.readQuery({ text: getUserByIdQueryText });
	if (err) {
		console.error("Error: Queries.getUserById failed with error: ", err);
		return;
	}
	return getUserByIdResult;
}

/**
 * Query to get the user profile by id.
 * @param {number} userId
 * @returns {array}
 */
Queries.getUserProfile = async (userId) => {
	let getUserProfileQueryText = `
		SELECT
			id, userName, (SELECT COUNT(*) FROM public.follow WHERE userId=${userId}) AS following,
			(SELECT COUNT(*) FROM public.follow WHERE followUserId=${userId}) AS followers
		FROM public.reunion_users WHERE id = ${userId}
	;`;

	let err, getUserProfileResult = await PGUtils.readQuery({ text: getUserProfileQueryText });
	if (err) {
		console.error("Error: Queries.getUserProfile failed with error: ", err);
		return;
	}
	return getUserProfileResult;
}

/**
 * Query to get user details given email and password.
 * @param {string} email
 * @param {string} password
 * @returns {array}
 */
Queries.getUserDetails = async (email, password) => {
	let getUserDetailsQueryText = `
		SELECT id, userName, email
		FROM public.reunion_users
		WHERE email = '${email}' AND passw = '${password}'
	;`;

	let err, getUserDetailsResult = await PGUtils.readQuery({ text: getUserDetailsQueryText });
	if (err) {
		console.error("Error: Queries.getUserDetails failed with error: ", err);
		return;
	}
	return getUserDetailsResult;
}

/**
 * Query to add post for a user.
 * @param {number} userId
 * @param {string} title
 * @param {string} content
 * @returns {array}
 */
Queries.addPostForUser = async (userId, title, content) => {
	let addPostForUserQueryText = `
		INSERT INTO public.post (userId, title, content)
		VALUES (${userId}, %L)
		RETURNING id, title, content, createdAt
	;`;

	let err, addPostForUserResult = await PGUtils.writeQuery({ text: PGUtils.getQueryFromTemplate(addPostForUserQueryText, [title, content]) });
	if (err) {
		console.error("Error: Queries.addPostForUser failed with error: ", err);
		return;
	}
	return addPostForUserResult;
}

/**
 * Query to delete post by id.
 * @param {number} userId
 * @param {number} postId
 * @returns {array}
 */
Queries.deletePostById = async (userId, postId) => {
	let addPostForUserQueryText = `
		DELETE FROM public.post
		WHERE id = ${postId} AND userId = ${userId}
		RETURNING id
	;`;

	let err, addPostForUserResult = await PGUtils.writeQuery({ text: addPostForUserQueryText });
	if (err) {
		console.error("Error: Queries.addPostForUser failed with error: ", err);
		return;
	}
	return addPostForUserResult;
}

/**
 * Query to follow a user by user id.
 * @param {number} userId
 * @param {number} followUserId
 * @returns {array}
 */
Queries.followUserById = async (userId, followUserId) => {
	let followUserByIdQueryText = `
		INSERT INTO public.follow (userId, followUserId)
		SELECT ${userId}, id
		FROM public.reunion_users
		WHERE id = ${followUserId}
		ON CONFLICT ON CONSTRAINT unique_follow
		DO UPDATE SET followUserId=EXCLUDED.followUserId
		RETURNING id
	;`;

	let err, followUserByIdResult = await PGUtils.writeQuery({ text: followUserByIdQueryText });
	if (err) {
		console.error("Error: Queries.followUserById failed with error: ", err);
		return;
	}
	return followUserByIdResult;
}

/**
 * Query to unfollow a user by user id.
 * @param {number} userId
 * @param {number} followUserId
 * @returns {array}
 */
Queries.unfollowUserById = async (userId, followUserId) => {
	let unfollowUserByIdQueryText = `
		DELETE FROM public.follow
		WHERE followUserId = ${followUserId} AND userId = (SELECT id FROM public.reunion_users WHERE id = ${userId})
		RETURNING id
	;`;

	let err, unfollowUserByIdResult = await PGUtils.writeQuery({ text: unfollowUserByIdQueryText });
	if (err) {
		console.error("Error: Queries.unfollowUserById failed with error: ", err);
		return;
	}
	return unfollowUserByIdResult;
}

/**
 * Query to like a post by post id.
 * @param {number} userId
 * @param {number} postId
 * @returns {array}
 */
Queries.likePostById = async (userId, postId) => {
	let likePostByIdQueryText = `
		INSERT INTO public.like (userId, postId)
		SELECT ${userId}, id
		FROM public.post
		WHERE id = ${postId}
		ON CONFLICT ON CONSTRAINT unique_like
		DO UPDATE SET postId=EXCLUDED.postId
		RETURNING id
	;`;

	let err, likePostByIdResult = await PGUtils.writeQuery({ text: likePostByIdQueryText });
	if (err) {
		console.error("Error: Queries.likePostById failed with error: ", err);
		return;
	}
	return likePostByIdResult;
}

/**
 * Query to unlike a post by post id.
 * @param {number} userId
 * @param {number} postId
 * @returns {array}
 */
Queries.unlikePostById = async (userId, postId) => {
	let unlikePostByIdQueryText = `
		DELETE FROM public.like
		WHERE userId = ${userId} AND postId = (SELECT id FROM public.post WHERE id = ${postId})
		RETURNING id
	;`;

	let err, unlikePostByIdResult = await PGUtils.writeQuery({ text: unlikePostByIdQueryText });
	if (err) {
		console.error("Error: Queries.unlikePostById failed with error: ", err);
		return;
	}
	return unlikePostByIdResult;
}

/**
 * Query to comment on a post by post id.
 * @param {number} userId
 * @param {number} postId
 * @param {string} comment
 * @returns {array}
 */
Queries.addCommentOnPostByUser = async (userId, postId, comment) => {
	let addCommentOnPostByUserQueryText = `
		INSERT INTO public.comment (userId, postId, comment)
		SELECT ${userId}, id, %L
		FROM public.post
		WHERE id = ${postId}
		RETURNING id
	;`;

	let err, addCommentOnPostByUserResult = await PGUtils.writeQuery({ text: PGUtils.getQueryFromTemplate(addCommentOnPostByUserQueryText, [comment]) });
	if (err) {
		console.error("Error: Queries.addCommentOnPostByUser failed with error: ", err);
		return;
	}
	return addCommentOnPostByUserResult;
}

/**
 * Query to get post by post id.
 * @param {number} postId
 * @returns {array}
 */
Queries.getPostById = async (postId) => {
	let getPostByIdQueryText = `
		SELECT id, title, content, createdAt, COALESCE(comments, '[]') AS comments, COALESCE(likes, 0) AS likes
		FROM public.post p
		LEFT JOIN (
			SELECT postId, JSON_AGG(
				json_build_object(
					'comment', comment,
					'createdAt', createdAt
				) ORDER BY createdAt
			) AS comments
			FROM public.comment
			GROUP BY postId
		) c ON c.postId = p.id
		LEFT JOIN (
			SELECT postId, COUNT(*) AS likes
			FROM public.like
			GROUP BY postId
		) l ON l.postId = p.id
		WHERE id = ${postId}
	;`;

	let err, getPostByIdResult = await PGUtils.readQuery({ text: getPostByIdQueryText });
	if (err) {
		console.error("Error: Queries.getPostById failed with error: ", err);
		return;
	}
	return getPostByIdResult;
}

/**
 * Query to get all post for user by user id.
 * @param {number} userId
 * @returns {array}
 */
Queries.getAllPostsOfUser = async (userId) => {
	let getAllPostsOfUserQueryText = `
		SELECT id, title, content, createdAt, COALESCE(comments, '[]') AS comments, COALESCE(likes, 0) AS likes
		FROM public.post p
		LEFT JOIN (
			SELECT postId, JSON_AGG(
				json_build_object(
					'comment', comment,
					'createdAt', createdAt
				) ORDER BY createdAt
			) AS comments
			FROM public.comment
			GROUP BY postId
		) c ON c.postId = p.id
		LEFT JOIN (
			SELECT postId, COUNT(*) AS likes
			FROM public.like
			GROUP BY postId
		) l ON l.postId = p.id
		WHERE userId = ${userId}
		ORDER BY createdAt
	;`;

	let err, getAllPostsOfUserResult = await PGUtils.readQuery({ text: getAllPostsOfUserQueryText });
	if (err) {
		console.error("Error: Queries.getAllPostsOfUser failed with error: ", err);
		return;
	}
	return getAllPostsOfUserResult;
}

module.exports = Queries;
