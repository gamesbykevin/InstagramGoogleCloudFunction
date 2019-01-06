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

//where we will store users that we want to not follow
const tmpBannedUserId = 6;

//list of people we will never follow
var listBanned = [];

//how many user ids are we allowed to store in each document
var bannedUserIdsPerDocument = process.env.bannedUserIdsPerDocument;

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

//if the difference between following and followers is less than this number, we need to start unfollowing
const followingThreshold = parseInt(process.env.followingThreshold);

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
	[
		"super", "nice", "great", "amazing", "cool", "beautiful", "awesome", "interesting", "excellent", "admirable", 
		"brilliant", "delightful", "fantastic", "legendary", "solid", "impressive", "stylish", "superb", "flawless", 
		"inspiring", "magical", "astounding", "good", "outstanding", "wow", "congrats", "congratulations", "smashing", 
		"epic", "topical", "wonderful", "lit", "slick", "tight"
	],
	["", "!","!!","!!!","!!!!","!!!!!"," :)"," :) :)","! :)"]
]

//list of two word comments
const commentList2 = [
	[
		"nice", "great", "amazing", "cool", "beautiful", "awesome", "interesting", "excellent", "admirable", "brilliant", 
		"delightful", "fantastic", "legendary", "solid", "impressive", "stylish", "superb", "flawless", "inspiring", "magical", 
		"astounding", "good", "outstanding", "wonderful"
	],
	[
		"work", "job", "hussle", "picture", "photo", "image", "effort", "post", "addition", "contribution", "performance", 
		"achievement", "creation", "creativity", "vision", "execution"
	],
	["", ".", "..", "...", ". :)", "!", "!!", "!!!", " :)", "! :)"]
];

//list of two word comments
const commentList2_2 = [
	["so", "very", "really", "that's", "that's very", "that's really"],
	[
		"nice", "amazing", "cool", "beautiful", "awesome", "interesting", "excellent", "admirable", "brilliant", "delightful", 
		"fantastic", "legendary", "solid", "impressive", "stylish", "superb", "flawless", "inspiring", "magical", "astounding", 
		"good", "outstanding", "epic", "clean", "fun"
	],
	["", ".", "..", "...", ". :)", "!", "!!", "!!!", " :)", "! :)"]
];

//list of three word comments
const commentList3 = [
	["this", "that", "it"],
	["is", "looks", "is really", "really is", "is just", "says", "simply is", "is simply"],
	["great", "amazing", "magical", "inspiring", "astounding", "good", "cool", "epic", "slick", "tight", "lit"],
	["", ".", "..", "...", ". :)", "!", "!!", "!!!", " :)", "! :)"]
];

//list of four word comments
const commentList4 = [
	["this", "that", "the", "your"],
	["picture", "photo", "image", "post", "contribution"],
	["is", "looks", "is just", "is really", "says", "simply is", "is simply"],
	["great", "amazing", "magical", "inspiring", "astounding", "good", "cool", "epic", "slick", "tight", "lit"],
	["", ".", "..", "...", ". :)", "!", "!!", "!!!", " :)", "! :)"]
];

//list of random phrases
const commentListMisc = [
	[
		"what a great job", "I like it", "can't wait to see more", "your work looks nice", "you got talent", "you got skill", "this is talent",
		"I like what you have done with this picture", "keep up the great work", "you did a great job", "your talented",
		"I like your posts", "you have a lot of talent", "very nice job", "your hard work will pay off", "just radiant", "great job, how did you do it",
		"I always look forward to these posts", "can't wait for the next one", "hope to see more", "killing it", "killing it right now",
		"Well accomplished", "Well accomplished mate", "mission accomplished", "this is amazing work", "cool work you have here", "such design",
		"It's appealing, not just good", "So gorgeous and sublime", "this is some good work"
	],
	["", "!", "!!", "!!!", "! :)", ". :)", " :)"]
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

//query the database to load our list of ignored users
async function loadListBanned() {
	
	console.log('loading our ignored users list from database');
	
	//reference our db
	const dbRef = await firestore.collection(metaDataTableName);
	
	//start our list as empty
	listBanned = [];
	
	//query the table and return the results in our snapshot
	var snapshot = await dbRef.where('id', '==', tmpBannedUserId).get();
	
	if (snapshot.docs.length < 1) {
		console.log('there are no ignored users in our list');
	} else {
		
		//check every result to create our list
		for (var index = 0; index < snapshot.docs.length; index++) {
			listBanned = listBanned.concat(snapshot.docs[index].data().userIds.split(','));
		}
	}
	
	console.log(listBanned.length.toLocaleString() + ' ignored user ids loaded')
}

//update list of ignored user ids in the database
async function updateBannedDB() {
	
	try {
		
		//reference our db
		const dbRef = await firestore.collection(metaDataTableName);
		
		//query the table and return the results in our snapshot
		var snapshot = await dbRef.where('id', '==', tmpBannedUserId).get();
		
		console.log('saving new user id data');
		
		var userIds = '';
		
		//keep track everytime we add a userId
		var newDataCount = 0;
		
		//keep track of existing data
		var existingDataCount = 0;
		
		for (var index = 0; index < listBanned.length; index++) {
			
			if (userIds.length > 0)
				userIds = userIds + ',';
			
			userIds = userIds + listBanned[index];
			
			//add 1 to the count
			newDataCount = newDataCount + 1;
			
			//if we reached the max allowed or are at the end of our list, save it in the db
			if (newDataCount >= bannedUserIdsPerDocument || index >= listBanned.length - 1) {
				
				//reset the count to 0
				newDataCount = 0;
				
				var result;
				
				//if we don't have any existing data or we already updated what's available we will add a new document here
				if (snapshot.docs.length < 1 || existingDataCount >= snapshot.docs.length) {
		
					console.log('saved new user data to a new document');
		
					//add data to database
					result = await dbRef.add({
						id: tmpBannedUserId, 
						userIds: userIds
					});
					
				} else {
									
					console.log('updated existing document');
									
					result = await dbRef.doc(snapshot.docs[existingDataCount].id).update({
						userIds: userIds
					});
					
					//after update keep track of our existing data in firestore
					existingDataCount = existingDataCount + 1;
					
				}
				
				console.log(result);
				
				//reset the list to an empty string
				userIds = '';
			}
		}
		
	} catch (error) {
		
		console.log(error);
		
	}
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
	
	//load the banned users list
	await loadListBanned();
	
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
	
	try {
		
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
		
	} catch (error) {
		console.log(error);
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
			
			//lets also make sure the user isn't banned
			for (var i = 0; i < listBanned.length; i++) {
				
				if (tmpAccountName == listBanned[i]) {
					console.log('This account was marked banned and we wont follow: "' + listBanned[i] + '"');
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
		
		var found = false;
		
		//lets add them to the banned list if they aren't already there
		for (var i = 0; i < listBanned.length; i++) {
			
			if (tmpAccountName == listBanned[i]) {
				found = true;
				return false;
			}
		}
		
		//if we didnt find it in our list, lets add it
		if (!found)
			listBanned.push(tmpAccountName);		
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
	const response = await page.goto(util.format(profilePage, tmpAccountName), { timeout: timeout });
	
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
	
	/*
	//how many users are they following
	follows = user_info['edge_follow']['count'];
	
	//how many people are following this user
	follower = user_info['edge_followed_by']['count'];
	
	//how many posts do they have
	media = user_info['edge_owner_to_timeline_media']['count'];
	
	//are we following this user
	followed_by_viewer = user_info['followed_by_viewer'];
	
	//have we requested to view this account (pending)
	requested_by_viewer = user_info['requested_by_viewer'];
	
	//their account has requested to view us (pending)
	has_requested_viewer = user_info['has_requested_viewer'];
	
	console.log(follows);
	console.log(follower);
	console.log(media);
	console.log(follow_viewer);
	console.log(followed_by_viewer);
	console.log(requested_by_viewer);
	console.log(has_requested_viewer);
	*/
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
	await page.waitFor(pause);
	
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
		var posts = jsonObj['graphql']['hashtag']['edge_hashtag_to_media']['edges'];
		
		//how many posts are there in the specific feed
		console.log(posts.length + ' posts for "' + tag + '" feed');
		
		//if we reached our max follow limit we won't follow anyone this time no matter what
		var canFollow = (followingCount < followingMax);
		
		//even if we can follow, lets decide at random if we just want to unfollow
		if (canFollow)
			canFollow = (Math.random() > .5);
	
		//if the number of following / followers are too close, we need to start unfollowing
		if (Math.abs(followingCount - followersCount) < followingThreshold)
			canFollow = false;
	
		//we can only perform so many actions each time this app runs
		var actionsPerformed = 0;
		
		//look at the recent posts
		for (var index = 0; index < posts.length; index++) {
						
			//if we can't possibly do anything more, exit the loop
			if (actionsPerformed >= actionLimit)
				break;
			
			//if we reached our daily limits let's exit
			if (tmpLikes >= maxLikes && tmpComments >= maxComments && (!canFollow || tmpFollows >= maxFollows || followingCount >= followingMax))
				break;
			
			//is this post a video?
			var video = (JSON.stringify(posts[index]['node']['is_video']).toLowerCase().indexOf("true") > -1);
			
			//what is the media id
			var mediaId = posts[index]['node']['shortcode'];

			//who posted this media?
			var tmpAccountName = await getUsername(mediaId, page);

			//is this an account we should interact with
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
			
			if (!hasIgnore) {
				
				//lets not do anything for a banned user as well
				for (var i = 0; i < listBanned.length; i++) {
					
					if (tmpAccountName == listBanned[i]) {
						console.log('This account was marked as banned and we will skip: "' + listBanned[i] + '"');
						hasIgnore = true;
						break;
					}
				}
			}

			//skip this post if we should ignore the account
			if (hasIgnore)
				continue;
			
			//what did we parse
			console.log('is post video: ' + video + ', mediaId: ' + mediaId + ', by user "' + tmpAccountName + '"');
			
			try {
				
				//follow this user if we are allowed to
				if (canFollow)
					await follow(tmpAccountName, page);
				
			} catch (error) {
				console.log(error);
				await page.waitFor(pause);
			}
			
			try {
				
				//attempt to like the media
				await like(mediaId, page);
				
			} catch (error) {
				console.log(error);
				await page.waitFor(pause);
			}
			
			try {
				
				//attempt to comment on the post if we haven't reached our limit
				if (tmpAccountName == username) {
					console.log('We wont comment because it is our post :)');
				} else {					
					//attempt to comment on the media
					await comment(mediaId, page, generateRandomComment(video));
				}
				
			} catch (error) {
				console.log(error);
				await page.waitFor(pause);
			}
			
			//keep track of how many things we are doing
			actionsPerformed = actionsPerformed + 1;
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
			
			//reset back to 0 for now
			actionsPerformed = 0;
			
			//check random users to see if we can unfollow
			while (users.length > 0 && actionsPerformed < actionLimit && tmpUnfollows < maxUnfollows) {
				
				//pick a random index
				var index = parseInt(Math.random() * users.length);
			
				//get the user name
				const tmpUsername = users[index]['node']['username'];
				
				//is this user following us
				const follows = await isFollowingUs(tmpUsername, page);
				
				//if they aren't following we will unfollow
				if (!follows) {
					await unfollow(tmpUsername, page);											
				} else {
					console.log(tmpUsername + ' is following us and we wont unfollow them');
				}
				
				//keep track of attempts
				actionsPerformed = actionsPerformed + 1;
			}			
		}

		/*
		//get list of our followers
		https://www.instagram.com/graphql/query/?query_id=17851374694183129&id=2223628835&first=50
		
		//this will go to the next page
		https://www.instagram.com/graphql/query/?query_id=17851374694183129&id=2223628835&first=50&after=QVFBZ1RXTXR3RXJfYV9TaUkxdzlEZjYyNmxCeE5MSUNQczJJeDJtQnlLOUZjaThCSzJMaEpHSnhYNXJQUjdMTjRXX2ZDREM0UlFjWmRjeE1BY2x6clhMag==
		
		//get list of people we are following
		https://www.instagram.com/graphql/query/?query_id=17874545323001329&id=2223628835&first=50
		*/
		
	} catch (error) {
		
		console.log(error);
		
	} finally {
		
		try {
			
			//update totals in the database
			await updateDB(tmpCommentsId, 	tmpComments);
			await updateDB(tmpLikesId, 		tmpLikes);
			await updateDB(tmpUnlikesId, 	tmpUnlikes);
			await updateDB(tmpFollowsId, 	tmpFollows);
			await updateDB(tmpUnfollowsId, 	tmpUnfollows);
			
			//update our list of banned users
			await updateBannedDB();
			
		} catch (error) {
			console.log(error);
		}
		
		try { 
			await browser.close(); 
		} catch (error) { 
			console.log(error);
		}
		
		if (res != null)
			res.status(200).send('Done');
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
	if (keyId != null && keyId.length > 60 && keyId == process.env.keyId) {

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
