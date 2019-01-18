var eaglePlatform = angular.module('eagleplatform', []);

function loginController($scope, $http, $window) {
    $scope.formData = {};

	$scope.login = function() {
		//hash pwd
		$scope.formData.passwordHash = sha256($scope.formData.password);
		console.log($scope.formData.password);

		$http.post	('/api/login', $scope.formData)
			.success(function(data) {
				if(data.length > 0) //if there is a user with that username/pwd
				{	
					$scope.errorMsg = null;
					localStorage.setItem("loggedUser", JSON.stringify(data[0]));				
					$window.location.href = "/home/";			
				}
				else
				{
					//Add error msg
					$scope.errorMsg = "Username o Password errati";
					$scope.formData.password = "";
				}
				
			})
			.error(function(data) {
			
			});
	}
}
