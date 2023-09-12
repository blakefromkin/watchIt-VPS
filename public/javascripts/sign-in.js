document.addEventListener("DOMContentLoaded", () => {
  const form = document.querySelector("#sign-in-form");

  document.querySelector("#register").addEventListener("click", function() {
    form.action = "/signup";
    form.method = "post";
    
    let event = new Event("submit");
    form.dispatchEvent(event);
  });

  document.querySelector("#sign-in").addEventListener("click", function() {
    form.action = "/signin";
    form.method = "post";
    
    let event = new Event("submit");
    form.dispatchEvent(event);
  });

  form.addEventListener("submit", e => {
    let username = document.querySelector("#username").value.trim();
    let password = document.querySelector("#password").value;
    if (!username || !password) {
      e.preventDefault();
      window.alert("Must enter username and password.");
    } else {
      form.submit();
    }
  });
});
