async function signInHandler(e) {
  e.preventDefault();

  let username = document.querySelector("#username").value.trim();
  let password = document.querySelector("#password").value;
  if (username === '') {
    window.alert("Must enter username.");
    return;
  }
  if (password === '') {
    window.alert("Must enter password.");
    return;
  }

  let credentials = {username, password};
  try {
    let response = await fetch("/signin", {
      method: "post",
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify(credentials)
    });
    if (!response.redirected) throw new Error(response.body);
  } catch(err) {
    if (err.message === "Invalid username and/or password.") {
      window.alert(err.message);
    } else console.log(err);
  }
}

async function registerHandler(e) {
  e.preventDefault();

  let username = document.querySelector("#username").value.trim();
  let password = document.querySelector("#password").value;
  if (username === '') {
    window.alert("Must enter username.");
    return;
  }
  if (password === '') {
    window.alert("Must enter password.");
    return;
  }

  let credentials = {username, password};
  try {
    let response = await fetch("/signup", {
      method: "post",
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify(credentials)
    });
    if (!response.redirected) throw new Error(response.body);
  } catch(err) {
    if (err.message === "Username already exists.") {
      window.alert(err.message);
    } else console.log(err);
  }
}

document.addEventListener("DOMContentLoaded", () => {
  document.querySelector("#sign-in").addEventListener("click", signInHandler);
  document.querySelector("#register").addEventListener("click", registerHandler);
});
