/*
* Subscribes a phone (SMS) to a topic
* Note: this requires phone and topic to be passed in.
*
* If phone already subscribed, do noting and return success
*
*   This is almost identical code to same lambda functiona that subscibes phone (AjmSubscribeEmailtoTopic)
*
*/
console.log('Loading list subscriptions event');
var AWS = require("aws-sdk");


exports.handler = function(event, context) {
    
    var sns = new AWS.SNS({region:'us-east-1'});
    var phone = (event.phone === undefined ? '' : event.phone);
    var topic = (event.topic === undefined ? '' : event.topic);
    var results = [];
    buildSubscriptionList(sns, '', results, function ( data ) {
        var subscribeTypes = getSubscribed(data, topic, '', phone);
        if (subscribeTypes.text_msg == '0'){
                var params = { Protocol: 'sms', TopicArn: topic, Endpoint: phone };
                sns.subscribe(params, function(err, data) { 
                    if (err) {
                        console.log(data);
                        context.fail("{'error':'Unable to subscribe phone number.'}");
                    }  
                    else {
                        context.succeed("{'success':'phone SMS subscribed'}");
                    }  

                });
        }
        else
            context.succeed("{'success':'phone SMS already subscribed'}");
    });
};


/*
    function:   getSubscribed
    builds a json entry:
    {   email : 0/1 ,   1 if email already subscribed to topic, zero otherwise
        text_msg: 0/1   1 if phone already subscribed to topic, zero otherwise
    }
*/
function getSubscribed(data, topic, email, phone) {
    var result = {'email':'0', 'text_msg':'0'};
    var subscriptions = getSubscriptionList(data, email, phone);
    var topics = subscriptions.email;
    topics.some( function(topic_name) {
        if (topic_name == topic) {
            result.email = '1';
            return 'true';
        }
    });
    
    topics = subscriptions.text_msg;
    topics.some( function(topic_name) {
        if (topic_name == topic) {
            result.text_msg = '1';
            return true;
        }
    });
    
    
    return result;
}

/*
    function:   getSubscriptionList
    builds a json entry:
    {   email : [list of topics subscibed by the email] ,
        text_msg" [list of topics subscribed to by phone]
    }
*/
function getSubscriptionList(data, email, phone) {
    var result_entry = {'email':[], 'text_msg':[]};
    data.forEach( function(subscription) {
        if (subscription.Protocol == "email" && subscription.Endpoint == email ) {
            result_entry.email.push(subscription.TopicArn);
        }
        else {
            if (subscription.Protocol == "sms" && subscription.Endpoint == phone ) {
                result_entry.text_msg.push(subscription.TopicArn);
            }
        }
    });
    return result_entry;
}

/*
    function:   buildSubscriptionList
    Recursive function to build up an array of subscriptions for the 
    current amazon account owner running this lambda function
*/
function buildSubscriptionList( sns, nextToken , results , onCompletionHandler) {
    var params = {};
    callback = onCompletionHandler;
    if (nextToken !== undefined) {
        if (nextToken !== '') params = { NextToken: nextToken};
        sns.listSubscriptions(params, function(err, data_next) {
            if (!err) {
                data_next.Subscriptions.forEach( function(subscription) {
                    results.push(subscription);
                } );
                buildSubscriptionList(sns, data_next.NextToken, results, onCompletionHandler);
            }
        });
    }
    else {
        return onCompletionHandler(results);
    }
        
}