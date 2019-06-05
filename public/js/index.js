var url = new URL(location.href);
var code = url.searchParams.get('code'); // user name for current session
var error = url.searchParams.get('error'); // user name for current session

if (code !== null) {
	showInputStudent();
	document.getElementById("exampleFormControlTextarea1").value = code;
	document.getElementById("exampleFormControlTextarea2").focus();

}

if (error !== null) {
	$('#error-message').text(error);
}
