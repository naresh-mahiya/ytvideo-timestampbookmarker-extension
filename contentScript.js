//to add the bookmark button on youtube video we are playing,
//we have to manipulate the current DOM...so content file operates in the context of the webpage

//this is Immediately invoked function expression in JS........() this immediately calls the function right after it is defined
(() => {
    let youtubeLeftControles, youtubePlayer;
    let currentVideo = "";
    let currentVideoBookmarks = [];


    //listen to any incoming messages from background
    chrome.runtime.onMessage.addListener((obj, sender, response) => {

        const { type, value, videoId } = obj;
        if (type === "NEW") {
            currentVideo = videoId;
            newVideoLoaded();
        }
        else if(type === "PLAY"){
            youtubePlayer.currentTime=value;
        } else if(type === "DELETE"){
            currentVideoBookmarks = currentVideoBookmarks.filter((b) => b.time != value);
            chrome.storage.sync.set({[currentVideo]: JSON.stringify(currentVideoBookmarks)}, () => {
                // Send back the updated bookmarks list
                response(currentVideoBookmarks);
            });
            return true; // Keep the message channel open for the async response
        }
    });


    //fetch bookmarks of that video
    const fetchBookmarks = () => {
        return new Promise((resolve, reject) => {
            chrome.storage.sync.get([currentVideo], (obj) => {
                resolve(obj[currentVideo] ? JSON.parse(obj[currentVideo]) : []);
            })
        })
    }






    const newVideoLoaded = async () => {
        const bookmarkBtnExists = document.getElementsByClassName("bookmark-btn")[0];
        currentVideoBookmarks = await fetchBookmarks();
        if (!bookmarkBtnExists) {
            const bookmarkBtn = document.createElement("img");//like div,p,span...create img tag element

            bookmarkBtn.src = chrome.runtime.getURL("assets/bookmark.png");
            bookmarkBtn.className = "ytp-button" + "bookmark-btn";
            bookmarkBtn.title = "click to bookmark current timestamp";

            //now take access of youtube video controles
            youtubeLeftControles = document.getElementsByClassName("ytp-left-controls")[0];
            youtubePlayer = document.getElementsByClassName("video-stream")[0];

            //add that bookmark button
            youtubeLeftControles.appendChild(bookmarkBtn);
            bookmarkBtn.addEventListener("click", addNewBookmarkEventHandler);


        }
    }

    newVideoLoaded(); //it prevent us from edge case like  when page is refreshed ....
    // only problem is this will cause the function to be executed twice but will be handled in if(!bookmarkBtn Exists)

    const addNewBookmarkEventHandler = async() => {
        const currentTime = youtubePlayer.currentTime;
        currentVideoBookmarks = await fetchBookmarks(); // to make sure using latest bookmarks

        const newBookmark = {
            time: currentTime,
            desc: "Bookmark at" + getTime(currentTime)
        };
        chrome.storage.sync.set({
            [currentVideo]: JSON.stringify([...currentVideoBookmarks, newBookmark].sort((a, b) => a.time - b.time))
        });
    }
})();

const getTime = t => {
    var date = new Date(0);
    date.setSeconds(t);
    return date.toISOString().substring(11, 19);
}