'use strict';

/**
 * @ngdoc overview
 * @name angularfireSlackApp
 * @description
 * # angularfireSlackApp
 *
 * Main module of the application.
 */
angular
  .module('angularfireSlackApp', [
    'firebase',
    'angular-md5',
    'ui.router'
  ])
  .config(function ($stateProvider, $urlRouterProvider) {
    $stateProvider
      .state('home', {
        url: '/',
        templateUrl: 'home/home.html',
        resolve: {
          requireNoAuth: function($state, Auth){
            return Auth.$requireAuth().then(function(auth){
              $state.go('channels');
            }, function(error){
              return;
            });
          }
        }
      })
      .state('login', {
        url: '/login',
        controller: 'AuthCtrl as authCtrl',
        templateUrl: 'auth/login.html',
        resolve: {
          requireNoAuth: function($state, Auth){
            return Auth.$requireAuth().then(function(auth){
              $state.go('home');
            }, function(error){
              return;
            });
          }
        }
      })
      .state('register', {
        url: '/register',
        controller: 'AuthCtrl as authCtrl',
        templateUrl: 'auth/register.html',
        resolve: {
          requireNoAuth: function($state, Auth){
            return Auth.$requireAuth().then(function(auth){
              $state.go('home');
            }, function(error){
              return;
            });
          }
        }
      })
      .state('profile', {
        url: '/profile',
        controller: 'ProfileCtrl as profileCtrl',
        templateUrl: 'users/profile.html',
        resolve: {
          auth: function($state, Users, Auth){
            return Auth.$requireAuth().catch(function(){
              $state.go('home');
            });
          },
          profile: function(Users, Auth){
            return Auth.$requireAuth().then(function(auth){
              return Users.getProfile(auth.uid).$loaded();
            });
          }
        }
      })
      .state('channels', {
        url: '/channels',
        controller: 'ChannelsCtrl as channelsCtrl',
        templateUrl: 'channels/index.html',
        resolve: {
          channels: function (Channels){
            return Channels.$loaded();
          },
          profile: function ($state, Auth, Users){
            return Auth.$requireAuth().then(function(auth){
              return Users.getProfile(auth.uid).$loaded().then(function (profile){
                if(profile.displayName){
                  return profile;
                } else {
                  $state.go('profile');
                }
              });
            }, function(error){
              $state.go('home');
            });
          }
        }
      })
      .state('channels.create', {
        url: '/create',
        templateUrl: '/channels/create.html',
        controller: 'ChannelsCtrl as channelsCtrl'
      })
      .state('channels.direct', {
        url: '/{uid}/messages/direct',
        templateUrl: '/channels/messages.html',
        controller: 'MessagesCtrl as messagesCtrl',
        resolve: {
          messages: function($stateParams, Messages, profile) {
            return Messages.forUsers($stateParams.uid, profile.$id).$loaded();
          },
          channelName: function($stateParams, Users) {
            return Users.all.$loaded().then(function() {
              return '@'+Users.getDisplayName($stateParams.uid);
            });
          }
        }
      })
      .state('channels.messages', {
        url: '/{channelId}/messages',
        templateUrl: 'channels/messages.html',
        controller: 'MessagesCtrl as messagesCtrl',
        resolve: {
          messages: function($stateParams, Messages){
            return Messages.forChannel($stateParams.channelId).$loaded();
          },
          channelName: function($stateParams, channels){
            return '#'+channels.$getRecord($stateParams.channelId).name;
          }
        }
      });

    $urlRouterProvider.otherwise('/');
  })
  .constant('FirebaseUrl', 'https://slackcloneandbeyond.firebaseio.com/', 
  {
  "rules":{
    ".read": true,
    "users":{
      "$uid":{
        ".write": "auth !== null && $uid === auth.uid",
        "displayName":{
          ".validate": "newData.exists() && newData.val().length > 0"
        },
        "online":{
          "$connectionId":{
            ".validate": "newData.isBoolean()"
          }
        }
      }
    },
    "channels":{
      "$channelId":{
        ".write": "auth !== null",
        "name":{
          ".validate": "newData.exists() && newData.isString() && newData.val().length > 0"
        }
      }
    },
    "channelMessages":{
      "$channelId":{
        "$messageId":{
          ".write": "auth !== null && newData.child('uid').val() === auth.uid",
          ".validate": "newData.child('timestamp').exists()",
          "body":{
            ".validate": "newData.exists() && newData.val().length > 0"
          }
        }
      }
    },
    "userMessages":{
      "$uid1":{
        "$uid2":{
          "$messageId":{
            ".read": "auth !== null && ($uid1 === auth.uid || $uid2 === auth.uid)",
            ".write": "auth !== null && newData.child('uid').val() === auth.uid",
            ".validate": "$uid1 < $uid2 && newData.child('timestamp').exists()",
            "body":{
              ".validate": "newData.exists() && newData.val().length > 0"
            }
          }
        }
      }
    }
  }
});
