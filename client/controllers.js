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

        //DEBUG: set advisor default page here
        $scope.templateURL = 'partials/setadvising.html';
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

//Controller that handles block creation for checksheet
angular.module('smApp').controller('blockController', ['$scope', '$http','$location', 'notificationFactory', 'AuthService', '$cookies',
    function($scope, $http, $location, notificationFactory, AuthService, $cookies) {
        
        //Default block json declared to to be added to the database
        $scope.block = {};
        $scope.block.creator = $scope.username + " " + $scope.lastname;
        $scope.block.creatorID = AuthService.getuserid();

        //Splice elective option from array
        $scope.removeoption = function (idx) {
            $scope.block.electivechoices.splice(idx,1)
        }

        //Array intialized to hold block details so that it can be bound to view
        $scope.block.details = [];
        //Default variables initialized to show changes in view
        $scope.divshow = true;

        //Build block function that creates array according to given number
        $scope.buildBlock = function (num){
             $scope.divshow = false;
             $scope.block.details = new Array(num);   
             $scope.block.electivechoices = [];
        };

        //Watch for change in length of block details
        $scope.$watch('block.details.length', function(val) {
            console.log(val);
             $scope.block.slot = val;
        });

        //Remove slot form block array
        $scope.removeslot = function (idx) {
            $scope.block.details.splice(idx,1);
        }
     
        //Add slot to block array
        $scope.addSlot = function (){
            $scope.block.details.length = $scope.block.details.length + 1;
          
          };
        
        //Add elective to block's elective choices       
       $scope.addelectiveoption = function (p,s) {
                $scope.block.electivechoices.push({
                    "prefix":p,
                    "suffix":s
                });
                console.log(JSON.stringify($scope.block.electivechoices));
                 console.log(JSON.stringify($scope.block.electivechoices.length));
            }

        //Adds slots to the blocks and submits it to the database
         $scope.submitSlot = function (){
          
        //Block json object is trimmed and made fit before submitting it to database by
        //changing structure according to block type and removing unnecessary attributes
        if ($scope.block.type != "Electives") {
                delete $scope.block.electivechoices;
            }
            $scope.block.credits = 0;
              angular.forEach($scope.block.details,function(value,index){
                if(value.rule=="None" || angular.isUndefined(value.rule) || value.rule === null ) { 
                delete value['rule'];
                delete value['ruleconstraint'];
                 }

                 if(value.prerequisite=="None" || angular.isUndefined(value.prerequisite) || value.prerequisite === null ) { 
                delete value['prerequisite'];
                delete value['prereqconstraint'];
                if(value.hascredit == "True"){  $scope.block.credits =  $scope.block.credits + 3; }
                }
            });
          
            //Add blocks to the database
            $http({
                    method: 'POST',
                    url: '/blocks',
                    // set the headers so angular passing info as form data (not request payload)
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    data: {
                        arraytoAdd: $scope.block
                    }

                }).success(function(data, status, headers, config) {
                 //Template will be set to show new advisors once addadvisor has been completed
                $scope.settemplateURL('partials/radvisor.html');
               notificationFactory.info("Successfully added block to database! ");
                })
                .error(function(data, status, headers, config) {
                    notificationFactory.error("Error: Status Code " + status + ". Contact admin if issue persists.")

                });
          };

    }
]);

//Controller designed to handle mixing of one or more checksheet block for the creation of a checksheet
angular.module('smApp').controller('blockviewer', ['$scope', '$http','$uibModal', 'notificationFactory', 'AuthService', '$cookies',
    function($scope, $http, $uibModal, notificationFactory, AuthService, $cookies) {

          $http({
                    method: 'GET',
                    url: '/blocks'

                }).success(function(data, status, headers, config) {
                    // this callback will be called asynchronously
                    // when the response is available
                    $scope.blocks = data;

                })
                .error(function(data, status, headers, config) {
                notificationFactory.error("Error: Status Code " + status + ". Contact admin if issue persists.");
                });
                $scope.divshow = true;
                $scope.currentPage = 1;
                $scope.pageSize = AuthService.getPaginationSize();
                $scope.cancelsub = function(){
                    $scope.divshow = true;
                }
                $scope.modifyBlock = function(blkID) {
                    $scope.divshow = false;
                    $scope.currentBlock = blkID;
                    //Deep copy of department object. This is because angular assigns stuff by reference by default
                    $scope.newID = angular.copy(blkID);
                    $scope.blkName = $scope.newID.name;
                     };

                $scope.submitmodifiedBlock = function(){
                    
                      $http({
                    method: 'PUT',
                    url: '/blocks',
                     // set the headers so angular passing info as form data (not request payload)
                     headers: {
                     'Content-Type': 'application/json'
                     },
             data: {
                newID: $scope.newID
            }

        }).success(function(data, status, headers, config) {
            // this callback will be called asynchronously
            // when the response is available
            
            
             if (status === 200) {
                angular.copy($scope.newID,$scope.currentBlock);

               notificationFactory.info("Successfully updated: "+$scope.newID.name)
                $scope.divshow = true;
            }

        })
        .error(function(data, status, headers, config) {

        notificationFactory.error("Error: Status Code "+status+". Contact admin if issue persists.")
        });
     }




  }
]);


//Controller for modal to modify department
angular.module('smApp').controller('checksheetModalController',
  ['$scope', '$filter','$uibModalInstance', 'chksID', '$http', 'notificationFactory', '$location',
    function ($scope,$filter,$uibModalInstance, chksID,$http,notificationFactory,$location) {

//Deep copy of department object. This is because angular assigns stuff by reference by default
$scope.newID = angular.copy(chksID);
$scope.chksName = $scope.newID.name;

//Cancel modal for department
$scope.cancel = function () {
    $uibModalInstance.dismiss('cancel');
  };


// Modify department information on the database
$scope.modify = function () {
 // create a new instance of deferred
    $http({
            method: 'PUT',
            url: '/checksheets',
            // set the headers so angular passing info as form data (not request payload)
            headers: {
                'Content-Type': 'application/json'
            },
            data: {
                newID: $scope.newID
            }

        }).success(function(data, status, headers, config) {
            // this callback will be called asynchronously
            // when the response is available
            $uibModalInstance.dismiss('cancel');
            //$location.url('/root/dashboard');
            
             if (status === 200) {
                angular.copy($scope.newID,chksID);

               notificationFactory.info("Successfully updated: "+$scope.newID.name)
            }

        })
        .error(function(data, status, headers, config) {

        $uibModalInstance.dismiss('cancel');
        notificationFactory.error("Error: Status Code "+status+". Contact admin if issue persists.")
        });
  };

}]);



//Controller designed to handle mixing of one or more checksheet block for the creation of a checksheet
angular.module('smApp').controller('checksheetviewer', ['$scope', '$http','$uibModal', 'notificationFactory', 'AuthService', '$cookies',
    function($scope, $http, $uibModal, notificationFactory, AuthService, $cookies) {

                $http({
                    method: 'GET',
                    url: '/checksheets'

                }).success(function(data, status, headers, config) {
                    // this callback will be called asynchronously
                    // when the response is available
                    $scope.checksheets = data;

                })
                .error(function(data, status, headers, config) {
                notificationFactory.error("Error: Status Code " + status + ". Contact admin if issue persists.");
                });

                $scope.currentPage = 1;
                $scope.pageSize = AuthService.getPaginationSize();
                   $scope.modifyChecksheet = function(chksID) {
                var modalInstance = $uibModal.open({
                templateUrl: 'partials/checksheetModal.html',
                controller: 'checksheetModalController',
                scope: $scope,
                resolve: {
                    chksID: function() {
                        return chksID;
                    }
                }
            });


        };




    }
]);





//Controller designed to handle mixing of one or more checksheet block for the creation of a checksheet
angular.module('smApp').controller('setadvisingcontroller', ['$scope', '$http','$location', 'notificationFactory', 'AuthService', '$cookies',
    function($scope, $http, $location, notificationFactory, AuthService, $cookies) {

    //Global appointment length constant
     $scope.appointmentLength = 15;

     $scope.appointmentTimes = {
        S : new Array(24*60/($scope.appointmentLength)),
        M :new Array(24*60/($scope.appointmentLength)),
        T : new Array(24*60/($scope.appointmentLength)),
        W : new Array(24*60/($scope.appointmentLength)),
        TH : new Array(24*60/($scope.appointmentLength)),
        F : new Array(24*60/($scope.appointmentLength)),
        SA : new Array(24*60/($scope.appointmentLength))
     };

     $scope.timeMinAMPM = "PM";
     $scope.timeMaxAMPM = "PM";
  
     $scope.timediff = 0;
     // $scope.appointmentTimes.length='15';
     // $scope.timeMinMin = '00';
     $scope.setMinAMPM = function(time){
       $scope.timeMinAMPM = time;        
     }
     $scope.setMaxAMPM = function(time){
       $scope.timeMaxAMPM = time;        
     }
     
     $scope.hourtoIndex = function(hour,minutes){
        // console.log("hour:"+hour);
        // console.log("hour:"+minutes);
        return (((hour-1)*4) + (minutes/15));
     }

     $scope.indexTohour = function(index){
        return [((Math.floor(index/4))+1),((index%4)*15)];
     }

     $scope.addAppt = function()
     {
        $scope.oneSlot = {};

        if($scope.timeMinAMPM=="PM"){
            $scope.oneSlot.minHR = parseInt($scope.timeMinHr) + 12;
        } else {
            $scope.oneSlot.minHR = parseInt($scope.timeMinHr);
        }
        if($scope.timeMaxAMPM=="PM"){
            $scope.oneSlot.maxHR = parseInt($scope.timeMaxHr) + 12;

        } else {
             $scope.oneSlot.maxHR = parseInt($scope.timeMaxHr);
    
        }


        if ($scope.oneSlot.maxHR >= $scope.oneSlot.minHR){
        $scope.oneSlot.timediff =  $scope.oneSlot.maxHR - $scope.oneSlot.minHR;

        }
        else
         {
        $scope.oneSlot.timediff = 24- ($scope.oneSlot.minHR - $scope.oneSlot.maxHR) ;
         }
         if ($scope.timeMinMin=='30'){ 
             if ($scope.oneSlot.maxHR == $scope.oneSlot.minHR) {  $scope.oneSlot.timediff = '24'; }
            $scope.oneSlot.timediff = $scope.oneSlot.timediff - 0.5 }
        if ($scope.timeMaxMin=='30'){ 
              if ($scope.oneSlot.maxHR == $scope.oneSlot.minHR) {  

                // $scope.timediff = '0.5';
                 }
            $scope.oneSlot.timediff = $scope.oneSlot.timediff + 0.5 }

            $scope.oneSlot.maxMin = parseInt($scope.timeMaxMin);
            $scope.oneSlot.minMin = parseInt($scope.timeMinMin);
        

   

            

           if ($scope.oneSlot.timediff >= 24 )
           {
            notificationFactory.error("You can't have more than 10 hours of appointment session at once!");
            console.log($scope.oneSlot.maxHR);
             console.log($scope.oneSlot.minHR);
           }
           else if ($scope.oneSlot.timediff == 0 ){
            notificationFactory.error("Minimum appointment time slot to be opened is 30 min. Try again.");
           }
           else
           {
            if (($scope.hourtoIndex($scope.oneSlot.minHR,$scope.oneSlot.minMin)) > ($scope.hourtoIndex($scope.oneSlot.maxHR,$scope.oneSlot.maxMin)))
            {
                console.log("opposite");
                for (i = ($scope.hourtoIndex($scope.oneSlot.minHR,$scope.oneSlot.minMin));
                 

                 i < $scope.appointmentTimes[$scope.timeDay].length; i++) 
                    {
                          console.log('This is i :'+i);
                    $scope.appointmentTimes[$scope.timeDay][i] = "true";
                    }

                for (i = 0; i < ($scope.hourtoIndex($scope.oneSlot.maxHR,$scope.oneSlot.maxMin)); i++) 
                    {
                          console.log('This is i :'+i);
                      $scope.appointmentTimes[$scope.timeDay][i] = "true";
                    }
            
            }
               else{
               console.log('this is i start:'+($scope.hourtoIndex($scope.oneSlot.minHR,$scope.oneSlot.minMin)));
                    console.log('while i is less than:'+($scope.hourtoIndex($scope.oneSlot.maxHR,$scope.oneSlot.maxMin)));
                    for (i = ($scope.hourtoIndex($scope.oneSlot.minHR,$scope.oneSlot.minMin)); i < ($scope.hourtoIndex($scope.oneSlot.maxHR,$scope.oneSlot.maxMin)) ; i++)
                    {
                    console.log('This is i :'+i);
                    $scope.appointmentTimes[$scope.timeDay][i] = "true";
                    }
               }
             
           }
          console.log(JSON.stringify($scope.appointmentTimes[$scope.timeDay]));

     }


  }
]);

//Controller designed to handle mixing of one or more checksheet block for the creation of a checksheet
angular.module('smApp').controller('advisorchecksheetController', ['$scope', '$http','$location', 'notificationFactory', 'AuthService', '$cookies',
    function($scope, $http, $location, notificationFactory, AuthService, $cookies) {

             //Method to modify templateURL 
               $http({
                        method: 'GET',
                        url: '/blockdetails'

                    }).success(function(data, status, headers, config) {
                        // this callback will be called asynchronously
                        // when the response is available
                        $scope.blockdetails = data;

                        //console.log(JSON.stringify($scope.courses | suffix:135));

                    })
                    .error(function(data, status, headers, config) {
                        notificationFactory.error("Error: Status Code " + status + ". Contact admin if issue persists.");
                    });

        //Initialize checksheet json type and arrays to hold checksheet information
        $scope.checksheet = {};
        $scope.checksheet.blockid = [];
        $scope.tempblockid = [];
        //Default checksheet attributes
        $scope.checksheet.creator = $scope.username + " " + $scope.lastname;
        $scope.checksheet.credits = 0;
        $scope.checksheet.creatorID = AuthService.getuserid();      
        $scope.divshow = true;

        //Watch for changes in bloc description
        $scope.$watch('blockdesc', function(val) {
        if($scope.blockdetails){
        for(var i=0; i < $scope.blockdetails.length; i++)
            {
                if ($scope.blockdetails[i]._id == val){
                    $scope.blockdetail = $scope.blockdetails[i];
                    break;
                }
            }
        }
        });

        //Add block to checksheet database
        $scope.addtochecksheet = function(val){
        // Loop through checksheet to unsure block has not been repeated twice
          for(var i=0; i < $scope.checksheet.blockid.length; i++)
          {
            if (val._id === $scope.checksheet.blockid[i]){
            notificationFactory.error("Error: You cannot add same block on a checksheet twice!");
            return;
            }
          }
           $scope.checksheet.blockid.push(val._id);
           $scope.checksheet.credits = $scope.checksheet.credits + val.credits;
           $scope.tempblockid.push(val);
           $scope.blockdesc='None';
        }

        //Remove block from checksheet
       $scope.removeblock = function(idx){
        $scope.checksheet.credits = $scope.checksheet.credits - $scope.tempblockid[idx].credits;
        $scope.checksheet.blockid.splice(idx,1);
        $scope.tempblockid.splice(idx,1);
       }

       //Submit checksheet to the checksheet database
       $scope.submitChecksheet = function(){
            $http({
                    method: 'POST',
                    url: '/checksheets',
                    // set the headers so angular passing info as form data (not request payload)
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    data: {
                        arraytoAdd: $scope.checksheet
                    }

                }).success(function(data, status, headers, config) {
                 //Template will be set to show new advisors once addadvisor has been completed
                $scope.settemplateURL('partials/radvisor.html');
               notificationFactory.info("Successfully added checksheet to database! ");
                })
                .error(function(data, status, headers, config) {
                notificationFactory.error("Error: Status Code " + status + ". Contact admin if issue persists.")

                });
       }

        $scope.buildChecksheet = function (){
        $scope.divshow = false;
        };
    }
]);
