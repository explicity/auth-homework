window.onload = () => {
  const loginBtn = document.querySelector("#submit-btn");
  const emailField = document.querySelector("#email-field");
  const pwField = document.querySelector("#password-field");

  loginBtn.addEventListener("click", ev => {
    ev.preventDefault();

    fetch("/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        email: emailField.value,
        password: pwField.value
      })
    })
      .then(res => {
        res.json().then(body => {
          console.log(body);
          if (body.auth) {
            localStorage.setItem("jwt", body.token);
            location.replace("/race");
          } else {
            console.log("Authentication failed");
          }
        });
      })
      .catch(err => {
        console.log("Request went wrong");
      });
  });
};
