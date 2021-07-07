const remote = require('electron').remote;
const shell = require('electron').shell;




var pages=['login','signup','dashboard','keys','notifications'];


function nextPage(currentPageID) {


window.location.href = `${pages[currentPageID]}.html`;
    
}


function logoutPage(currentPageID) {


    window.location.href = 'login.html';
        
    }
    

function closeWindow() {
    window.close();
}
function openURL(url) {
    shell.openExternal(url);
}
