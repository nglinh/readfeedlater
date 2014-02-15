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

            if (siblingElement.length == 0)
                return;

            var firstChild = siblingElement.children().first();
            url = $(firstChild[0]).attr('href');
            if (url.indexOf('www.facebook.com') < 0)
                url = 'www.facebook.com' + url;

            var data = {'id': 1, 'url': url};
            //console.log(JSON.stringify(data));

            $.ajax({
                type: 'POST',
                url : 'http://readfeedlater.herokuapp.com/api/savefeed',
                data : data,
                dataType: 'application/x-www-form-urlencoded',
                statusCode: {
                    403: function() {console.log ("403 error")}
                }
            })
            .done(function() {console.log('success');})
            .fail(function() {console.log('failure');});
        });

        $(spanElement).append(hyperlinkElement);
        $(this).after(spanElement);
        $(this).after(' · ');
        $(this).attr('readfeedlaterBookmark', true);
    });
}

$(window).scroll(addBookmarkLinkToPost);

addBookmarkLinkToPost();
