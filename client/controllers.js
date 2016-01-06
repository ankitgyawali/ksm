//Main login controller that handles login of three different user types
angular.module('smApp').controller('loginController', ['$scope', '$location', 'notificationFactory', 'AuthService', '$timeout',
    function($scope, $location, notificationFactory, AuthService, $timeout) {

        //Check if usertype has been set
        console.log("if auth get usertype: " + AuthService.getusertype());

        if (AuthService.getusertype() == undefined || AuthService.getusertype() == '') {
        //If usertype has not been set already set it to student so that student login is showed by default
        console.log("not defined so student");
        AuthService.setusertype('student');
        }
        //Finally get usertype from factory
        $scope.userType = AuthService.getusertype()
        //Set user local function that can be accessed in view
        $scope.setUser = function(val) {

            AuthService.setusertype(val);
            $scope.userType = AuthService.getusertype();

            $timeout(function() {
                console.log('setUser Auth from controler: ' + AuthService.getusertype())
            }, 100);

        }
        //Submit function that passes email password and usertype to factory so that it can be 
        //authenticated thre
        $scope.submit = function() {
            var x = AuthService.login($scope.Email, $scope.Password, $scope.userType)
                .then(function() {
                    //Setlocation url according to type of user that is logged in
                    //This url is locked via app.config in main.js
                    //The url point to dashboard type and provides necessary access controls
                    if (AuthService.isLoggedIn()) {
                        if (AuthService.getusertype() == "root") {
                            $location.url('/root/dashboard');
                        } else if (AuthService.getusertype() == "student") {
                            $location.url('/student/dashboard');
                        } else if (AuthService.getusertype() == "advisor") {
                            $location.url('/advisor/dashboard');
                        } else {
                            $location.url('/login');
                        }
                        notificationFactory.success('Logged in as ' + AuthService.getusername());

                    }

                })
                // Hangles authentication error
                .catch(function() {
                    notificationFactory.error('Invalid username & password combination');

                });


        };


    }
]);


//Main Root Controller that handles root dashboard
angular.module('smApp').controller('advisorController', ['$scope', '$http', '$location', 'notificationFactory', 'AuthService', '$cookies',
    function($scope, $http, $location, notificationFactory, AuthService, $cookies) {

        //Instantiates templateURL for dashboard constant at parent scope so subsequent child
        //controllers can modify it
        // $scope.templateURL = 'partials/rdept.html';
        $scope.templateURL = 'partials/checksheetblock.html';
        //Get username and type at parent scope
        $scope.username = AuthService.getusername();
        $scope.lastname = AuthService.getlastname()
        $scope.usertype = AuthService.getusertype();
        //Method to modify templateURL 
               $http({
                        method: 'GET',
                        url: '/classes'

                    }).success(function(data, status, headers, config) {
                        // this callback will be called asynchronously
                        // when the response is available
                        $scope.dpts = data.dpts;
                        $scope.courses = data.courses;
                        //console.log(JSON.stringify($scope.courses | suffix:135));

                    })
                    .error(function(data, status, headers, config) {
                        notificationFactory.error("Error: Status Code " + status + ". Contact admin if issue persists.");
                    });
        $scope.settemplateURL = function(temp) {
            $scope.templateURL = temp;
        };

        //Logout function that utilizes factory service 
        $scope.logout = function() {
            AuthService.logout();
            notificationFactory.info("Logged out succesfully!")
            $location.url('/login');
        };

    }
]);

//Main Root Controller that handles root dashboard
angular.module('smApp').controller('blockController', ['$scope', '$http','$location', 'notificationFactory', 'AuthService', '$cookies',
    function($scope, $http, $location, notificationFactory, AuthService, $cookies) {
        $scope.block = {};
        $scope.block.slots = 1;
        $scope.block.ok = [];
        $scope.block.creator = $scope.username + " " + $scope.lastname;;
        $scope.block.creatorID = AuthService.getuserid();

        $scope.removeoption = function (idx) {
            $scope.block.ok.splice(idx,1)
        }
        $scope.block.details = new Array($scope.block.slots);   
        $scope.divshow = true;
        $scope.buildBlock = function (){
             $scope.divshow = false;
             $scope.block.details = new Array($scope.block.slots);   
             console.log($scope.block.details);
            console.log(JSON.stringify($scope.block));
            if($scope.block.type=="Electives"){
                $scope.block.details[0].rule = [];
            }

        };
     
          $scope.addSlot = function (){
            $scope.block.details.length = $scope.block.details.length + 1;
          
          };
       
            $scope.addelectiveoption = function (p,s) {
                $scope.block.ok.push({
                    "prefix":p,
                    "suffix":s
                });
                console.log(JSON.stringify($scope.block.ok));
                 console.log(JSON.stringify($scope.block.ok.length));
            }
         $scope.submitSlot = function (){
          
            console.log("OLD:-> "+JSON.stringify($scope.block));

              angular.forEach($scope.block.details,function(value,index){
                if(value.rule=="None") { 
                delete value['rule'];
                delete value['ruleconstraint'];
                 }

                if(value.prerequisite=="None") {
                delete value['prerequisite'];
                delete value['prereqconstraint'];

                }
                
            });
             console.log("NEW:-> "+JSON.stringify($scope.block));

          };

    }
]);
