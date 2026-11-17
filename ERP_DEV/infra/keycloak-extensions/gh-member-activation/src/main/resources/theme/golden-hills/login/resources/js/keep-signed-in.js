// Golden Hills sign-in page: "Remember me" (keep me signed in) is ticked by default, so a member who signs in on
// their phone stays signed in after closing the browser (realm remember-me lifetimes; D-127). They can untick it on a
// shared device. Only the sign-in form has this box; other pages are untouched.
document.addEventListener("DOMContentLoaded", function () {
  var box = document.getElementById("rememberMe");
  if (box) box.checked = true;
});
