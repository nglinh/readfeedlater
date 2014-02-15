// Add bookmark link
var BOOKMARK_TEXT = 'Bookmark';
//$('a.share_action_link').after(' · <span><a>' + BOOKMARK_TEXT + '</a></span>');

var addBookmarkLinkToPost = function() {
    $('a.share_action_link').after(function() {
        if ($(this).attr("readfeedlaterBookmark") != undefined) {
            return;
        }

        var spanElement = $("<span>");
        var hyperlinkElement = $("<a>", {class:"readfeedlaterBookmark"});
        hyperlinkElement.html(BOOKMARK_TEXT);

        var shareElement = $(this);
        hyperlinkElement.click(function() {
            // Get the post URL
            var siblingElement = shareElement.siblings().has('a>abbr');

            if (siblingElement.length != 0) {
                var firstChild = siblingElement.children().first();
                var url = $(firstChild[0]).attr('href');
                if (url.indexOf('www.facebook.com') < 0)
                    url = 'www.facebook.com' + url;
                console.log(url);
            }

            var data = {'id': 1, 'url': url};

            $.ajax({
                type: 'POST',
                url : 'readfeedlater.herokuapp.com',
                data : JSON.stringify(data),
                dataType: 'json'
            });
        });

        $(spanElement).append(hyperlinkElement);
        $(this).after(spanElement);
        $(this).after(' · ');
        $(this).attr('readfeedlaterBookmark', true);
    });
}

$(window).scroll(addBookmarkLinkToPost);

addBookmarkLinkToPost();
