//used to connect to the database
const Firestore = require('@google-cloud/firestore');

//project id where we our db is
const myProjectId = process.env.myProjectId;

//we will access our database to store cookies
const cookieTableName = process.env.cookieTableName;
const cookieId = 1;

//track our account activity so we don't exceed our limits and get banned (this should never change)
const metaDataTableName = process.env.metaDataTableName;
const tmpFollowsId = 1;
const tmpUnfollowsId = 2;
const tmpLikesId = 3;
const tmpUnlikesId = 4;
const tmpCommentsId = 5;

//track if we already commented on a specific media
const commentDataTableName = process.env.commentDataTableName;

//our firestore reference so we can authenticate connecting
const firestore = new Firestore({
	projectId: myProjectId
});

//used as web driver to browse the web
const puppeteer = require('puppeteer');

const util = require('util');

//credentials
const username = process.env.username;
const password = process.env.password;

//our browser will have specific dimensions
const width  = parseInt(process.env.width);
const height = parseInt(process.env.height);

//when to timeout our browser
const timeout = parseInt(process.env.timeout);

//sometimes we might want to wait for a short time
const pause 	 = parseInt(process.env.pause);
const pauseShort = parseInt(process.env.pauseShort);

//our browser agent
const userAgent = process.env.userAgent;

//instagram home page where we verify we are logged in
const homePage = process.env.homePage;

//where do we login
const loginPage = process.env.loginPage;

//the url to get a list of users we are following
const followingJsonPage = process.env.followingJsonPage;

//profile page providing json data about a user
const profileJsonPage = process.env.profileJsonPage;

//the profile page of a user
const profilePage = process.env.profilePage;

//the page where we like / comment
const mediaPage = process.env.mediaPage;

//page listing recent media for a specific tag
const tagsPage = process.env.tagsPage;

//how many people are we allowed to follow (max)
const followingMax = parseInt(process.env.followingMax);

//how many followers do we have?
var followersCount = 0;

//how many people are we following?
var followingCount = 0;

//how many milliseconds per day
const millisecondsPerDay = 86400000;

//if headless is true, no gui will be shown
const headless = true;

//what is our account name description? used to verify login
const accountNameDesc = process.env.accountNameDesc;

//list of tags where we will "like / comment / follow"
const tags = process.env.tags.split(",");

//list of names, if a users account contains this name we will ignore them
const ignore = process.env.ignore.split(",");

//track our totals for the past 24 hours so we don't get banned
var tmpLikes 	 = 0;
var tmpUnlikes 	 = 0;
var tmpComments  = 0;
var tmpFollows 	 = 0;
var tmpUnfollows = 0;

//set our 24 hour limits so we don't get banned
var maxLikes 	 = parseInt(process.env.maxLikes);
var maxUnlikes 	 = parseInt(process.env.maxUnlikes);
var maxComments  = parseInt(process.env.maxComments);
var maxFollows 	 = parseInt(process.env.maxFollows);
var maxUnfollows = parseInt(process.env.maxUnfollows);

//how many times we do a particular action each time this app runs (like, follow, comment)
const actionLimit = parseInt(process.env.actionLimit);

//list of one word comments
const commentList1 = [
	["super", "nice", "great", "amazing", "cool", "beautiful", "awesome", "interesting", "excellent", "admirable", "brilliant", "delightful", "fantastic", "legendary", "solid", "impressive", "stylish", "superb", "flawless", "inspiring", "magical", "astounding", "good", "outstanding", "wow", "congrats", "congratulations", "smashing"],
	["!","!!","!!!","!!!!","!!!!!"," :)"," :) :)","! :)",""]
]

//list of two word comments
const commentList2 = [
	["nice", "great", "amazing", "cool", "beautiful", "awesome", "interesting", "excellent", "admirable", "brilliant", "delightful", "fantastic", "legendary", "solid", "impressive", "stylish", "superb", "flawless", "inspiring", "magical", "astounding", "good", "outstanding"],
	["work", "job", "hussle", "picture", "photo", "image", "effort", "post", "addition", "contribution", "performance", "achievement", "creation", "creativity", "vision"],
	["", ".", "..", "...", ". :)", "!", "!!", "!!!", " :)", "! :)"]
];

//list of two word comments
const commentList2_2 = [
	["so", "very", "really", "that's", "that's very", "that's really"],
	["nice", "amazing", "cool", "beautiful", "awesome", "interesting", "excellent", "admirable", "brilliant", "delightful", "fantastic", "legendary", "solid", "impressive", "stylish", "superb", "flawless", "inspiring", "magical", "astounding", "good", "outstanding"],
	["", ".", "..", "...", ". :)", "!", "!!", "!!!", " :)", "! :)"]
];

//list of three word comments
const commentList3 = [
	["this", "that", "the photo", "this photo", "that photo"],
	["is", "looks", "is really", "really is", "is just", "says", "simply is", "is simply"],
	["great", "amazing", "magical", "inspiring", "astounding", "good", "cool"],
	["", ".", "..", "...", ". :)", "!", "!!", "!!!", " :)", "! :)"]
];

//list of four word comments
const commentList4 = [
	["this", "that", "the", "your"],
	["picture", "photo", "image", "post", "contribution"],
	["is", "looks", "is just", "is really", "says", "simply is", "is simply"],
	["great", "amazing", "magical", "inspiring", "astounding", "good", "cool"],
	["", ".", "..", "...", ". :)", "!", "!!", "!!!", " :)", "! :)"]
];

//list of random phrases
const commentListMisc = [
	[
		"what a great job", "I like it", "can't wait to see more", "your work looks nice", 
		"I like what you have done with this picture", "keep up the great work", "you did a great job",
		"I like your posts"
	],
	["!", "!!", "!!!", "! :)", ". :)", " :)"]
];

//our browser reference object
var browser;

async function getBrowserPage() {
	
	var page;
	
	//how many attempts to open the browser
	var count = 0;
	
	//here we will continue to create the browser because of anonymous error on google cloud
	while (true) {
		
		//keep track how many times we try to open the browser
		count = count + 1;
		
		try {
			
			console.log('opening browser attempt ' + count);
			browser = await puppeteer.launch({args: ['--no-sandbox'], headless: headless});
				
			//access the page we will be using to browse
			page = await browser.newPage();
			
			//we need to set the user agent as well
			console.log('User agent: ' + userAgent);
			await page.setUserAgent(userAgent);
		
			//what is the size of the window we are simulating
			console.log('window size: w=' + width + ', h=' + height);
			await page.setViewport({ width: width, height: height });
			
			//if we made it this far we can exit the loop
			break;
			
		} catch (error) {
			console.log(error);
		}
	}
	
	//return our page
	return page;	
}

async function login(page) {
			
	try {

		//go to the login page
		console.log('logging in');
		const response = await page.goto(loginPage, { timeout: timeout });

		//enter login credetials
		const usernameTag = '[name="username"]';
		const passwordTag = '[name="password"]';
		console.log('waiting to enter login credentials');
		await page.waitForSelector(usernameTag);
		await page.waitForSelector(passwordTag);
		console.log('entering credentials');
		await page.type(usernameTag, username);		
		await page.type(passwordTag, password);
		
		//clicking login
		console.log('clicking login');
		await page.click("._0mzm-.sqdOP.L3NKy");
		
		//wait for the page to load after clicking login
		await page.waitForNavigation();
		
		//verify we are logged in
		var result = await verifyLogin(page);
		
		//if we aren't logged in, throw error
		if (!result) {
			
			//at this point we should have been logged in
			throw new Error('Couldn\'t verify login');
			
		} else {
			
			//get all cookies and save them for future use
			const cookies = await page.cookies();
			console.log(cookies);
			await saveCookies(cookies);
		}
			
	} catch (error) {
		throw new Error(error);
	}
}

//make sure we are logged in (true=yes, false=no)
async function verifyLogin(page) {
	
	try {
		
		console.log('verifying login');
		
		//opening home page
		await page.goto(homePage, { timeout: timeout });
		
		//look for account name tag
		console.log('checking for account name to ensure we are logged in');
		const accountNameTag = '.f5Yes.oL_O8';
		await page.waitForSelector(accountNameTag);
		const element = await page.$(accountNameTag);
		const text = await (await element.getProperty('textContent')).jsonValue();
		
		//if account name is on the page we logged in successfully
		if (text == accountNameDesc) {
			console.log('we are logged in');
			return true;
		} else {
			console.log('Text not found for account name: "' + text + '"');
		}
		
	} catch (error) {
		console.log(error);
	}
	
	//we couldn't verify that we are logged in
	console.log('not logged in');
	return false;
}

//load our cookie information (if exists)
async function loadCookies(page) {
	
	//load file data if it exists
	console.log('loading cookies');
	
	//query the table and return the results in our snapshot
	var snapshot = await firestore.collection(cookieTableName).where('id', '==', cookieId).get();
	
	//make sure our objects are not null and has 1 result as expected
	if (snapshot != null && snapshot.docs != null && snapshot.docs.length == 1) {
		
		console.log('parsing cookies');
		
		//read text from db and parse to json array
		var tmpCookies = JSON.parse(snapshot.docs[0].data().cookieData);
		
		//inject each cookie into our browser page
		for (var i = 0; i < tmpCookies.length; i++) {
			console.log('injecting cookie - ' + tmpCookies[i].name);
			await page.setCookie(tmpCookies[i]);
		}
		
		//success
		return true;
		
	} else {
		console.log('cookies not found');
	}
	
	//we weren't successful loading cookies
	return false;
}

//here we will add / update the cookies
async function saveCookies(cookieData) {
	
	console.log('Saving cookies');
	
	try {
		
		//if this is still a json object, convert it to a string
		if (typeof cookieData == 'object')
			cookieData = JSON.stringify(cookieData);
		
		//reference our cookie document
		const cookieRef = firestore.collection(cookieTableName);
		
		//query the table and return the results in our snapshot
		var snapshot = await cookieRef.where('id', '==', cookieId).get();
		
		if (snapshot.docs.length < 1) {
			
			//if there are no results we will add
			var result = await cookieRef.add({id: cookieId, cookieData: cookieData});
			console.log(result);
			console.log('Cookie(s) added to db - ' + cookieId);
			
		} else {
			
			//if cookies already exist we will update
			var result = await cookieRef.doc(snapshot.docs[0].id).update({cookieData: cookieData});
			console.log(result);
			console.log('Cookie(s) updated in db - ' + cookieId);
		}
		
		//return success
		return true;
		
	} catch (error) {
		
		console.log(error);
		
		//no success
		return false;
	}
}

//here we will look at our profile and database to identify our status / limits
async function loadMetaData(page) {
	
	console.log('loading meta data');
	
	//load the profile details
	const response = await page.goto(util.format(profileJsonPage, username), { timeout: timeout });
	
	//the response is json
	const jsonObj = JSON.parse(await response.text());
	
	//parse our data
	followersCount = parseInt(jsonObj['graphql']['user']['edge_followed_by']['count']);
	followingCount = parseInt(jsonObj['graphql']['user']['edge_follow']['count']);
	console.log(followersCount + ' followers');
	console.log(followingCount + ' following');
	
	console.log('loading totals from db');
	
	//load our current totals
	tmpLikes 	 = await getTotals(tmpLikesId);
	tmpUnlikes   = await getTotals(tmpUnlikesId);
	tmpComments  = await getTotals(tmpCommentsId);
	tmpFollows 	 = await getTotals(tmpFollowsId);
	tmpUnfollows = await getTotals(tmpUnfollowsId);
	
	console.log('totals loaded');
	console.log('tmpLikes: ' + tmpLikes);
	console.log('tmpUnlikes: ' + tmpUnlikes);
	console.log('tmpComments: ' + tmpComments);
	console.log('tmpFollows: ' + tmpFollows);
	console.log('tmpUnfollows: ' + tmpUnfollows);
}

async function getTotals(dataId) {
	
	//reference our db
	const dbRef = await firestore.collection(metaDataTableName);
	
	console.log('querying data for - ' + dataId);
	
	//query the table and return the results in our snapshot
	var snapshot = await dbRef.where('id', '==', dataId).get();
	
	if (snapshot.docs.length > 0) {
		
		//how much time has passed
		const elapsed = new Date().getTime() - parseInt(snapshot.docs[0].data().timestamp);
		
		//console.log('elapsed: ' + elapsed + ', limit: ' + millisecondsPerDay);
		
		//if its been 24 hours, reset the count
		if (elapsed >= millisecondsPerDay) {
			
			console.log('24 hour reset count');
			
			//update the count
			var result = await dbRef.doc(snapshot.docs[0].id).update({
				count: 0,
				timestamp: new Date().getTime()
			});
			
			//we are back to 0
			return 0;
			
		} else {
		
			//return the db result
			return parseInt(snapshot.docs[0].data().count);
		}
		
	} else {
		
		console.log('totals not yet in database');
		
		//save in the database
		await updateDB(dataId, 0);
		
		//return 0
		return 0;
	}
}

async function hasComment(mediaId) {
	
	//reference our db
	const dbRef = await firestore.collection(commentDataTableName);
	
	//query the table and return the results in our snapshot
	var snapshot = await dbRef.where('mediaId', '==', mediaId).get();
		
	//if we have a result, we already commented
	if (snapshot.docs.length > 0)
		return true;
	
	//no results means we have not yet commented
	return false;
}

async function trackComment(mediaId) {
	
	//reference our db
	const dbRef = await firestore.collection(commentDataTableName);
	
	//store data in database
	var result = await dbRef.add({
		mediaId: mediaId
	});
	
	console.log('Comment tracked in db - ' + mediaId);	
}

async function updateDB(dataId, count) {
	
	console.log('dataId: ' + dataId + ', count: ' + count);
	
	//reference our db
	const dbRef = await firestore.collection(metaDataTableName);
	
	//query the table and return the results in our snapshot
	var snapshot = await dbRef.where('id', '==', dataId).get();
	
	if (snapshot.docs.length < 1) {
		
		//if there are no results we will add
		var result = await dbRef.add({
			id: dataId, 
			count: count,
			timestamp: new Date().getTime()
		});
		
		console.log('Data added to db - ' + dataId);
		
	} else {
		
		//if exists we will update
		var result = await dbRef.doc(snapshot.docs[0].id).update({
			count: count
		});
		
		console.log('Data updated in db - ' + dataId);
	}
}

async function follow(tmpAccountName, page) {
	return await changeRelationship(tmpAccountName, page, true);
}

async function unfollow(tmpAccountName, page) {
	return await changeRelationship(tmpAccountName, page, false);
}

//here we will follow / unfollow a user
async function changeRelationship(tmpAccountName, page, follow) {
	
	if (tmpAccountName == username) {
		console.log('we cant change the relationship because this is our account :)');
		return false;
	}
	
	if (follow) {
		
		console.log('attempting to follow ' + tmpAccountName);
		
		//if we reached the limit we aren't allowed to anymore people
		if (followingCount >= followingMax) {
			console.log('We are following ' + followingCount + ' and cant follow any more people (max: ' + followingMax + ')');
			return false;
		} else if (tmpFollows >= maxFollows) {
			console.log('we have reached the max # of follows for now');
			return false;
		} else {
			
			//lets make sure the account name isnt part of the ignore list
			for (var i = 0; i < ignore.length; i++) {
				
				//if the text is part of the username we won't follow them
				if (tmpAccountName.toLowerCase().indexOf(ignore[i].toLowerCase()) > -1) {
					console.log('This account was found on our ignore list and we wont follow: "' + ignore[i] + '"');
					return false;
				}
			}
		}
		
	} else {
		
		console.log('attempting to unfollow ' + tmpAccountName);
		
		//check here for unfollow limits
		if (tmpUnfollows >= maxUnfollows) {
			console.log('we have reached the max # of unfollows for now');
			return false;
		}
	}
	
	console.log('opening profile page for "' + tmpAccountName + '"');
	await page.goto(util.format(profilePage, tmpAccountName), { timeout: timeout });
	
	console.log('clicking button');
	
	const buttonFollow = '._5f5mN.jIbKX._6VtSN.yZn4P';
	const buttonUnfollow = '._5f5mN.-fzfL._6VtSN.yZn4P';
	
	if (follow) {
		
		if (await page.$(buttonUnfollow) != null) {
			console.log('we have already followed this user');
			return false;
		}
		
		//keep track of total followers
		followingCount = followingCount + 1;
		
		//keep track of our recent activity
		tmpFollows = tmpFollows + 1;
		
		//update database
		await updateDB(tmpFollowsId, tmpFollows);
		
		console.log(tmpFollows + ' of ' + maxFollows + ' daily total.');
		
		//click button
		await page.click(buttonFollow);
		
	} else {
				
		if (await page.$(buttonFollow) != null) {
			console.log('we have already unfollowed this user');
			return false;
		}
		
		//keep track of total followers
		followingCount = followingCount - 1;
		
		//keep track of our recent activity
		tmpUnfollows = tmpUnfollows + 1;
		
		//update database
		await updateDB(tmpUnfollowsId, tmpUnfollows);
		
		console.log(tmpUnfollows + ' of ' + maxUnfollows + ' daily total.');
		
		//click button
		await page.click(buttonUnfollow);
	}
	
	//wait for page for a short amount of time
	await page.waitFor(pause);

	console.log('We are following ' + followingCount + ' people');
	
	//success
	return true;
}

async function changeMedia(mediaId, page, like) {
	
	console.log('attempting to ' + ((like) ? 'like' : 'unlike') + ' media id: ' + mediaId);
	
	if (like && tmpLikes >= maxLikes) {
			
		//if we reached our limit there is no need to continue
		console.log('we have reached the max # of likes for now');
		return false;
		
	} else if (!like && tmpUnlikes >= maxUnlikes) {
		
		//if we reached our limit there is no need to continue
		console.log('we have reached the max # of unlikes for now');
		return false;
	}
	
	console.log('opening page for media id: "' + mediaId + '"');
	await page.goto(util.format(mediaPage, mediaId), { timeout: timeout });
	
	//click appropriate button to like / unlike
	console.log('clicking ' + ((like) ? 'like' : 'unlike'));
	const likeSelector = '.glyphsSpriteHeart__filled__24__red_5.u-__7';
	const unlikeSelector = '.glyphsSpriteHeart__outline__24__grey_9.u-__7';
	
	if (like) {
		
		//if the liked selector is already present, we don't need to like again
		if (await page.$(likeSelector) != null) {
			
			console.log('media already liked, we dont need to do this again');
			return false;
			
		} else {
			
			tmpLikes = tmpLikes + 1;
			await updateDB(tmpLikesId, tmpLikes);
			console.log(tmpLikes + ' of ' + maxLikes + ' daily total.');
			await page.click(unlikeSelector);
			console.log('liked media: ' + mediaId);
		}
		
	} else {
		
		if (await page.$(unlikeSelector) != null) {
			
			console.log('media already unliked, we dont need to do this again');
			return false;
			
		} else {
			
			tmpUnlikes = tmpUnlikes + 1;
			await updateDB(tmpUnlikesId, tmpUnlikes);
			console.log(tmpUnlikes + ' of ' + maxUnlikes + ' daily total.');
			await page.click(likeSelector);
			console.log('unliked media: ' + mediaId);
		}
	}
	
	//wait for page for a short amount of time
	await page.waitFor(pause);
	
	//success
	return true;
}

async function like(mediaId, page) {
	return await changeMedia(mediaId, page, true);
}

async function unlike(mediaId, page) {
	return await changeMedia(mediaId, page, false);
}

async function comment(mediaId, page, commentText) {
	
	console.log('attempting to comment media id: ' + mediaId);
	
	//check to make sure we don't exceed our limits
	if (tmpComments >= maxComments) {
		console.log('we have reached the max # of comments for now');
		return false;
	}
	
	//we cant comment again
	if (await hasComment(mediaId)) {
		console.log('we have already commented here and wont do it again');
		return false;
	}
	
	console.log('opening page for media id: "' + mediaId + '"');
	await page.goto(util.format(mediaPage, mediaId), { timeout: timeout });
	
	//where do we enter our comment
	const commentContainer = '.Ypffh';
	
	console.log('entering comment');
	await page.type(commentContainer, commentText);	
	
	//hit enter to add the comment
	console.log('pressing enter');
	await page.keyboard.press('Enter');
	
	console.log('comment added');
	
	//keep track of the number of comments
	tmpComments = tmpComments + 1;
	await updateDB(tmpCommentsId, tmpComments);
	
	//track comment so we dont comment twice
	await trackComment(mediaId);
	
	console.log(tmpComments + ' of ' + maxComments + ' daily total.');
	
	//wait for page for a short amount of time
	await page.waitFor(pause);
	
	//success
	return true;
}

async function isFollowingUs(tmpAccountName, page) {
	
	//load user profile page
	const response = await page.goto('https://www.instagram.com/' + tmpAccountName, { timeout: timeout });
	
	//get source code from page
	const htmlSource = await response.text();
	
	//parse json data from the html source
	var results = htmlSource.match('window._sharedData = (.*?);</script>');
	
	//parse json object from our match array results
	const all_data = JSON.parse(results[1])['entry_data']['ProfilePage'][0];
	
	//user data is located here
	var user_info = all_data['graphql']['user'];
	
	//does this user follow us
	follow_viewer = user_info['follows_viewer'];
	
	//is this user following us?
	return (follow_viewer == 'true');	
}

//here we will load the media post of a page in order to get the username
async function getUsername(mediaId, page) {
	
	console.log('opening page for media id: "' + mediaId + '"');
	await page.goto(util.format(mediaPage, mediaId), { timeout: timeout });
	
	const accountNameTag = '.FPmhX.notranslate.nJAzx';
	await page.waitForSelector(accountNameTag);
	const element = await page.$(accountNameTag);
	const text = await (await element.getProperty('textContent')).jsonValue();
	
	//wait for page for a short amount of time
	await page.waitFor(pauseShort);
	
	//return our username
	return text;
}

function generateRandomComment(video) {
	
	var commentList;
	
	//pick a random comment list
	switch (parseInt(Math.random() * 6)) {
		
		case 0:
			commentList = commentList1;
			break;
			
		case 1:
			commentList = commentList2;
			break;
			
		case 2:
			commentList = commentList2_2;
			break;
			
		case 3:
			commentList = commentList3;
			break;
			
		case 4:
		default:
			commentList = commentList4;
			break;
			
		case 5:
			commentList = commentListMisc;
			break;
	}	
	
	var comment = '';
	
	//now from the random chosen list, we generate a random comment
	for (var i = 0; i < commentList.length; i++) {
		
		//pick random index
		let index = parseInt(Math.random() * commentList[i].length);
		
		//get random word from current index
		var word = commentList[i][index];
		
		if (i != 0 && i != commentList.length - 1)
			comment += ' ';
		
		//add to our comment
		comment += word;
	}
	
	//if we are commenting on a video we have to replace some words
	if (video) {
		comment = comment.replace("picture", "video");
		comment = comment.replace("photo", "vid");
		comment = comment.replace("image", "clip");
	}
	
	return comment;
}

async function runCustomAgent(res) {
	
	try {
		
		//first thing we do is open our browser to create our page reference
		const page = await getBrowserPage();
		
		//were we successful loading cookies?
		var resultCookie = false;
		
		//were we successful verifying the login?
		var resultVerifyLogin = false;
		
		//load our cookies (if they exist)
		resultCookie = await loadCookies(page);
		
		//if we were able to load our cookies, check if we are logged in
		if (resultCookie)
			resultVerifyLogin = await verifyLogin(page);
		
		//if we couldn't verify that we are logged in, do it now
		if (!resultVerifyLogin)
			await login(page);
		
		//now that we are logged in, load our profile info
		await loadMetaData(page);
		
		//pick a random tag
		var tag = tags[parseInt(Math.random() * tags.length)];

		//load the tag feed detail
		const response = await page.goto(util.format(tagsPage, tag), { timeout: timeout });
		
		//the response is json
		const jsonObj = JSON.parse(await response.text());
		
		//parse our data so we can loop through the posts
		var posts = followersCount = jsonObj['graphql']['hashtag']['edge_hashtag_to_media']['edges'];
		
		//how many posts are there in the specific feed
		console.log(posts.length + ' posts for "' + tag + '" feed');
		
		//if we reached our max follow limit we won't follow anyone this time no matter what
		const canFollow = (followingCount < followingMax);
		
		//we can only perform so many actions each time this app runs
		var actionLike = 0;
		var actionComment = 0;
		var actionFollow = 0;
		var actionUnfollow = 0;
		
		//check all recent posts
		for (var index = 0; index < posts.length; index++) {
			
			//is this post a video
			var video;
			
			//if we can't possibly do anything more, then exit the loop
			if (
				(actionLike >= actionLimit || tmpLikes >= maxLikes) && 
				(actionComment >= actionLimit || tmpComments >= maxComments) && 
				(!canFollow || actionFollow >= actionLimit || followingCount >= followingMax || tmpFollows >= maxFollows)
			) {
				
				console.log('actionLimit: ' + actionLimit);
				console.log('we have done all that we can for now since we reached our limits');
				break;
			}
			
			//if true flag it as true so our comments say video instead of picture :)
			if (JSON.stringify(posts[index]['node']['is_video']).toLowerCase().indexOf("true") > -1) {
				video = true;
			} else {
				video = false;
			}
			
			//what is the media id
			var mediaId = posts[index]['node']['shortcode'];

			//who posted this media?
			var tmpAccountName = await getUsername(mediaId, page);

			//do we ignore this account
			var hasIgnore = false;
			
			//lets make sure the account name isnt part of the ignore list
			for (var i = 0; i < ignore.length; i++) {
				
				//if the text is part of the username we will ignore them
				if (tmpAccountName.toLowerCase().indexOf(ignore[i].toLowerCase()) > -1) {
					console.log('This account was found on our ignore list and we will ignore: "' + ignore[i] + '"');
					hasIgnore = true;
					break;
				}
			}

			//skip this post if we should ignore the account
			if (hasIgnore)
				continue;
			
			//what did we parse
			console.log('is post video: ' + video + ', mediaId: ' + mediaId + ', by user "' + tmpAccountName + '"');
			
			try {
				
				//attempt to follow this user if we haven't reached our limit
				if (canFollow && actionFollow < actionLimit) {
					var resultFollow = await follow(tmpAccountName, page);
					
					//if we are successful keep track
					if (resultFollow)
						actionFollow = actionFollow + 1;
				}
				
			} catch (error) {
				
				console.log(error);
				
				//wait for page for a short amount of time
				await page.waitFor(pauseShort);
			}
			
			try {
				
				//attempt to like the post if we haven't reached our limit
				if (actionLike < actionLimit) {
					var resultLike = await like(mediaId, page);
					
					//if we are successful keep track
					if (resultLike)
						actionLike = actionLike + 1;
				}
				
			} catch (error) {
				
				console.log(error);
				
				//wait for page for a short amount of time
				await page.waitFor(pauseShort);
			}
			
			try {
				
				//attempt to comment on the post if we haven't reached our limit
				if (tmpAccountName == username) {
					console.log('We wont comment because it is our post :)');
				} else {
					
					if (actionComment < actionLimit) {
						var resultComment = await comment(mediaId, page, generateRandomComment(video));
						
						//if we are successful keep track
						if (resultComment)
							actionComment = actionComment + 1;
					}
				}
				
			} catch (error) {
				
				console.log(error);
				
				//wait for page for a short amount of time
				await page.waitFor(pauseShort);
			}
			
			//how are we doing so far
			console.log('actionLike: ' + actionLike);
			console.log('actionComment: ' + actionComment);
			console.log('actionFollow: ' + actionFollow);
		}
		
		//how are we doing so far
		console.log('done going through feed');
		
		//if we weren't allowed to follow anyone, let's see if we can unfollow some people
		if (!canFollow) {
			
			console.log('loading json to see if we can unfollow anyone');
			
			//load the json to see who we are following
			const response = await page.goto(followingJsonPage, { timeout: timeout });
			
			//the expected response is json
			const obj = JSON.parse(await response.text());			
			
			//get the list of users
			var users = obj['data']['user']['edge_follow']['edges'];
			
			//check each user one by one starting at the end
			for (var index = users.length - 1; index >= 0; index--) {
				
				try {
					
					if (actionUnfollow < actionLimit && tmpUnfollows < maxUnfollows) {
					
						//get the user name
						const tmpUsername = users[index]['node']['username'];
						
						//is this user following us
						var follows = await isFollowingUs(tmpUsername, page);
						
						//if they aren't following we will unfollow
						if (!follows) {
							
							var resultUnfollow = await unfollow(tmpUsername, page);
							
							//if we are successful keep track
							if (resultUnfollow)
								actionUnfollow = actionUnfollow + 1;
						}
						
					} else {
						
						//if we can't unfollow anymore exit loop
						break;
					}
					
				} catch (error) {
					console.log(error);
				}
				
				console.log('actionUnfollow: ' + actionUnfollow);
			}
		}

		//we are successful
		res.status(200).send('Done');
		
	} catch (error) {
		console.log(error);
		res.status(500).send(error);
	} finally {
		
		try { 
			await browser.close(); 
		} catch (error) { 
			console.log(error);
		}
	}
	
	console.log('Done');
}

/**
 * Responds to any HTTP request.
 *
 * @param {!express:Request} req HTTP request context.
 * @param {!express:Response} res HTTP response context.
 */
exports.runAgent = (req, res) => {
    
	//obtain the keyId from the query string
	const keyId = req.query.keyId;

	//notify the key provided
	console.log("Key provided: " + keyId);

	//make sure correct key specified to invoke function
	if (keyId != null && keyId.length > 8 && keyId == process.env.keyId) {

		//print valid key id
		console.log("Key Id valid");

		//execute the process
		runCustomAgent(res);
		
	} else {

		//someone tried to access without a valid key
		console.log("Invalid key provided");
		res.status(200).send('Done');
	}
};
