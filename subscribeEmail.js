/*
* Subscribes an email to a topic
* Note: this requires email and topic to be passed in
*/
console.log('Loading list subscriptions event');
var AWS = require("aws-sdk");

exports.handler = function(event, context) {
    var sns = new AWS.SNS({region:'us-east-1'});

    var email = (event.email === undefined ? '' : event.email);
    var topic = (event.topic === undefined ? '' : event.topic);

    var params = {};
    sns.listSubscriptions(params, function(err, data) {
        if (err) {
            console.log(err, err.stack); // an error occurred
            context.fail("Unable to process current subscriptions. Please notify the system administrator.");
        }
        else {
            subscribeTypes = getSubscribed(data, topic, email, '');

            if (!subscribeTypes.email){
                var params = { Protocol: 'email', TopicArn: topic, Endpoint: email };
                sns.subscribe(params, function(err, data) { 
                    if (err) {
                        console.log(data);
                        context.fail("{'error':'Unable to subscribe email address.'}");
                    }  
                    else {
                        context.succeed("{'success':'email subscribed'}");
                    }  

                });
            }
            else
                context.succeed("{'success':'email already subscribed'}");
        }
    });

};


function getSubscribed(data, topic, email, phone) {
    result = {'email':false, 'text_msg':false};
    subscriptions = getSubscriptionList(data, topic, email, phone);
    topics = subscriptions.email;
    topics.some( function(topic_name) {
        if (topic_name == topic) {
            result.email = true;
            return true;
        }
        else return false;
    });
    
    topics = subscriptions.text_msg;
    topics.some( function(topic_name) {
        if (topic_name == topic) {
            result.text_msg = true;
            return true;
        }
        else return false;
    });
    
    
    return result;
}


function getSubscriptionList(data, topic, email, phone) {
    result_entry = {'email':[], 'text_msg':[]};
    var subscriptions = data.Subscriptions;
    subscriptions.forEach( function(subscription) {
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