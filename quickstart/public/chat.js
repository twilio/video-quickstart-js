var timeStamp = (new  Date()).getTime();
var chatClient ;
var channelType ;
var channelName ;
var myChannel ;
var memberName;
var firstTypedLetter='Y';
var endpointId ;
var flagIsPrivate ;

// Shorthand for $( document ).ready()
$(function() {
    console.log( "ready!" );
    $('#memberName').val(getUrlParameter("memberName"));
    $('#channelName').val(getUrlParameter("channel"));
});

function getTokenAndSetupChat(memberName,endpointId)
{
    return new Promise(function(resolve, reject)
        {

            $.get('/token?identity=' + memberName + '&endpointId=' + endpointId + '&isChat=1', function( data )
                {
                    resolve(data);
                    console.log(data);
                }
            );

        });
}

function startChat(cobrowserId,sessionKey)
{
    $('#chatHistory').empty();
    // hard code type to public, 2 for private
    channelType="1";
    channelName=$('#room-name').val();
    memberName="";

    if (channelName === "")
    {
        channelName="General";
    }


    if (memberName === "")
    {
        memberName = "anonymous"+timeStamp;
    }

    endpointId = memberName+':'+timeStamp;

    getTokenAndSetupChat(memberName,endpointId)
        .then(
            function(data)
            {

                console.log(data.token)
                chatClient = new Twilio.Chat.Client(data.token);

                chatClient.initialize()
                    .then(function(client)
                        {

                            console.log("Ready to Chat , will check if channel " +channelName  + " already exists ") ;

                            client.getChannelByUniqueName(channelName)
                                .then(function(chosenChannel)
                                    {
                                        console.log(channelName  + "already exists ") ;
                                        myChannel=chosenChannel;



                                        myChannel.join().then(function(channel)
                                            {
                                                console.log('Joining channel ' + channel.friendlyName)
                                                $('#statusMessages').text('Joining channel ' + channel.friendlyName);
                                                getHistory(channel.friendlyName);
                                            });

                                        myChannel.on('messageAdded', function(message)
                                            {
                                                if ( message.author != memberName)
                                                    printMessage(message.author, message.body)
                                            });

                                        /*chatClient.on("channelJoined", function(channel)
                                                         {
                                                             console.log("We have been joined to a channel, sid: " + channel.sid );
                                                             $('#statusMessages').text('Joined channel ' + channel.friendlyName);
                                                             getHistory(channel.friendlyName);
                                                           })*/

                                    }

                                )
                                .catch(function(err)
                                    {
                                        console.log("channelType : " + channelType);
                                        if ( channelType === "1")
                                        {
                                            flagIsPrivate = false ;
                                        }
                                        else
                                        {
                                            flagIsPrivate = true ;
                                        }

                                        console.log(channelName  + " does not exists .Will create your channel now ( private = " + flagIsPrivate + ")" ) ;

                                        client.createChannel({
                                            uniqueName: channelName,
                                            friendlyName: channelName,
                                            isPrivate	: flagIsPrivate
                                        }).then(function(createdChannel)
                                            {
                                                console.log('Created  channel:');
                                                $('#statusMessages').text('Created channel ' + createdChannel.friendlyName);
                                                console.log(createdChannel);
                                                myChannel=createdChannel;
                                                myChannel.on('messageAdded', function(message)
                                                    {
                                                        if ( message.author != memberName)
                                                            printMessage(message.author, message.body)
                                                    });

                                                myChannel.join().then(function(channel)
                                                    {
                                                        console.log('Joining channel ' + channel.friendlyName)
                                                        $('#statusMessages').text('Joining channel ' + channel.friendlyName);
                                                        getHistory(channel.friendlyName);
                                                    });

                                            });
                                    }

                                )


                        }

                    );



            }
        );


}

function getHistory()
{

    myChannel.getMessages(5)
        .then(function(latestPage)
            {
                console.log(latestPage)
                for (var i=0;i<5;i++)
                {
                    //printMessage(latestPage.items[i].author , latestPage.items[i].body) ;

                }
            }
        );

}

function sendMessage(body)
{

    myChannel.sendMessage(body);
    console.log("Message Sent");
    $('#statusMessages').text("Sent");
    firstTypedLetter='Y';
    printMessage(memberName,body)


}


function printMessage(auth,msg)
{
    console.log("Message by " + auth+ "received")

    var chatHistoryDiv=$('#chatHistory') ;

    if (auth === memberName )
    {
        //$('#chatHistory').append( "<div ><span class='left'>"+auth+":"+msg+"</span></div><hr>" );
        chatHistoryDiv.append(
            "<div class='chat-message bubble-left' >"+
            "<div class='avatar'>"+
            "<img src='http://clipart-library.com/img1/754540.png' alt='' width='32' height='32'>"+
            "</div>"+
            "<div class='chat-message-content'>" +
            "<h5>"+msg+"</h5>"+
            //"<span class='chat-time right'>13:35</span>"+
            //"<p class='right'>Me</p>"+
            "</div> <!-- end chat-message-content -->"+
            //"<hr>"+
            "</div> <!-- end chat-message -->"
        );



    }
    else
    {
        //$('#chatHistory').append( "<div ><span class='right'>"+auth+":"+msg+"</span></div><hr>" );
        chatHistoryDiv.append(
            "<div class='chat-message bubble-right'>"+
            "<img src='https://cdn.glitch.com/dc415a0e-213d-4b6e-9f5b-181c910c5294%2FminionKevin.png?1490112728077' alt='' width='32' height='32'>"+
            "<div class='chat-message-content'>" +
            //"<span class='chat-time'>13:35</span>"+
            "<p font-size='50%' font-style= 'italic'>"+auth+"</p>"+
            "<h5>"+msg+"</h5>"+
            "</div> <!-- end chat-message-content -->"+
            //"<hr>"+
            "</div> <!-- end chat-message -->"
        );
    }
    $("#chatHistory").animate({ scrollTop: $("#chatHistory")[0].scrollHeight}, 1000);

}






$('#chatInput').on('keydown', function(e)
    {
        if(firstTypedLetter==='Y')
        {
            $('#statusMessages').text("Typing....");

        }
        firstTypedLetter='N';
        if (e.keyCode === 13)
        {
            var msg = $('#chatInput').val();
            if (msg != '' )
            {
                sendMessage(msg);
                $('#chatInput').val('');

            }

        }
        else if (myChannel) { myChannel.typing(); }
    }
);


function showChatWindow()
{
    $('#chatWindow').show();

}


function showSignInWindow()
{
    $('#signInWindow').show();

}


function hideChatWindow()
{
    $('#chatWindow').hide();

}


function hideSignInWindow()
{
    $('#signInWindow').hide();

}

function getUrlParameter(name) {
    name = name.replace(/[\[]/, '\\[').replace(/[\]]/, '\\]');
    var regex = new RegExp('[\\?&]' + name + '=([^&#]*)');
    var results = regex.exec(location.search);
    return results === null ? '' : decodeURIComponent(results[1].replace(/\+/g, ' '));
};
