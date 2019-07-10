const playersList = document.getElementById("players-list");

// factory design pattern
const User = function(id, name) {
  const user = {};
  user.id = id;
  user.name = name;

  const view = new View();

  user.display = function() {
    const newLi = view.createElement({
      tagName: "li",
      attributes: {
        id: "user-" + this.id
      }
    });

    this.createName(newLi);
    this.createProgressBar(newLi);

    playersList.appendChild(newLi);
  };

  user.createName = function(item) {
    item.innerHTML = `${this.name}`;
  };

  user.createProgressBar = function(item) {
    const progressBarDiv = view.createElement({
      tagName: "div",
      className: "progress"
    });
    const progressBar = view.createElement({
      tagName: "div",
      className: "progress-bar",
      attributes: {
        role: "progressbar",
        id: "progress-" + this.id,
        "aria-valuenow": 0,
        "aria-valuemin": 0,
        "aria-valuemax": 100
      }
    });

    progressBar.style.width = "0%";

    progressBarDiv.appendChild(progressBar);
    item.appendChild(progressBarDiv);
  };

  user.delete = function() {
    const userLi = document.getElementById("user-" + this.id);
    userLi.parentNode.removeChild(userLi);
  }

  return user;
};

const currentUser = {
  displayCurrent() {
    const userLi = document.getElementById("user-" + this.id);
    const progressBar = document.getElementById("progress-" + this.id);

    progressBar.classList.add("bg-success");
    userLi.style.color = "green";
  }
};

class View {
  createElement({ tagName, className = "", attributes = {} }) {
    const element = document.createElement(tagName);

    if (className) {
      className.split(" ").map(item => element.classList.add(item));
    }

    Object.keys(attributes).forEach(key =>
      element.setAttribute(key, attributes[key])
    );

    return element;
  }
}

export { User, currentUser };
