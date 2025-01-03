let yaml = undefined
const config = {
  durationStep: 10,
  gap: 2,
  tick: 1000,
  currentY: Math.round(window.innerHeight / 2),
  isDragging: false,
}

function setYaml(y) {
  yaml = y
}

/**
 * Loads the flow from a yaml file. Convert the list of Tasks into a linked list.
 *
 * @param {string} filePath
 * @returns {Task}
 */
async function loadFlowFromYaml(filePath) {
  const response = await fetch(filePath)
  let result = await response.text()
  let list = yaml.parse(result)

  let startNode = undefined
  let previousNode = undefined
  let time = 0
  for (let [itemName, itemData] of Object.entries(list)) {
    let task = new Task(
      itemData.duration,
      previousNode,
      undefined,
      itemData.title,
      itemData.text,
      itemData.picture,
      time,
      time + itemData.duration
    )
    time += itemData.duration + config.gap
    if (previousNode) {
      previousNode.next = task
    } else {
      startNode = task
    }
    previousNode = task
  }
  return [startNode, time]
}

/**
 * Renders the defined flow
 *
 * @param {Task} startNode
 */
function renderFlow(startNode) {
  let flowElement = document.getElementById("flow")
  flowElement.innerHTML = ""
  let currentTask = startNode
  while (currentTask) {
    console.log(currentTask)
    flowElement.innerHTML += renderTask(currentTask)
    currentTask = currentTask.next
  }
  flowElement.style.transform = `translate(0, ${config.currentY}px)`
  addTouchListeners(flowElement);
}

/**
 * Start the flow by setting up a interval on which the flow will be updated
 * each update moves the flow by a certain amount
 */
function startFlow(startNode, endTick) {
  let flowElement = document.getElementById("flow")
  let ticks = -1
  setTimeout(() => {
    flowElement.style.transition = "transform 1000ms linear"
  }, config.tick)
  let intervalId = setInterval(() => {
    ticks = Math.round((Math.round(window.innerHeight / 2) - config.currentY) / 10)
    console.log("Ticks: ", ticks)
    config.currentY -= config.durationStep
    flowElement.style.transform = `translate(0, ${config.currentY}px)`
    checkTasks(ticks, startNode)
    if (ticks > endTick) {
      clearInterval(intervalId)
    }
  }, config.tick)
}

/**
 * Check if a task is in the current frame
 */
function checkTasks(ticks, startNode) {
  let currentTask = startNode
  while (currentTask) {
    if (ticks === currentTask.endFrame) {
      console.log("Task: ", currentTask.title)
      let audio = document.getElementById("audio")
      audio.play();
      alert(currentTask.title)
    }
    currentTask = currentTask.next
  }
}

function addTouchListeners(flowElement) {
  let startY = 0;
  let initialY = 0;

  flowElement.addEventListener('touchstart', (event) => {
    startY = event.touches[0].clientY;
    initialY = config.currentY;
    flowElement.style.transition = 'none';
  });

  flowElement.addEventListener('touchmove', (event) => {
    const deltaY = event.touches[0].clientY - startY;
    config.currentY = Math.round(initialY + deltaY);
    flowElement.style.transform = `translate(0, ${config.currentY}px)`;
  });

  flowElement.addEventListener('touchend', () => {
    flowElement.style.transition = 'transform 1000ms linear';
  });

  flowElement.addEventListener('mousedown', (event) => {
    startY = event.clientY;
    initialY = config.currentY;
    config.isDragging = true;
    flowElement.style.transition = 'none';
  });

  flowElement.addEventListener('mousemove', (event) => {
    if (config.isDragging) {
      const deltaY = event.clientY - startY;
      config.currentY = initialY + deltaY;
      flowElement.style.transform = `translate(0, ${config.currentY}px)`;
    }
  });

  flowElement.addEventListener('mouseup', () => {
    config.isDragging = false;
    flowElement.style.transition = 'transform 1000ms linear';
  });

  flowElement.addEventListener('mouseleave', () => {
    config.isDragging = false;
    flowElement.style.transition = 'transform 1000ms linear';
  });
}

/**
 * Renders a single task
 *
 * @param {Task} task
 */
function renderTask(task) {
  return `
    <task-element
      duration="${task.duration}" 
      title="${task.title}"
      text="${task.text}"
      picture="${task.picture}"
      startFrame="${task.startFrame}"
      endFrame="${task.endFrame}"
    ></task-element>
  `
}

class Task {
  constructor(duration, previous, next, title, text, picture, startFrame, endFrame) {
    this.duration = duration
    this.previous = previous
    this.next = next
    this.title = title
    this.text = text
    this.picture = picture
    this.startFrame = startFrame
    this.endFrame = endFrame
  }
}


class TaskElement extends HTMLElement {
  getProperties() {
    this.duration = this.getAttribute("duration")
    this.title = this.getAttribute("title")
    this.text = this.getAttribute("text")
    this.picture = this.getAttribute("picture")
    this.startFrame = this.getAttribute("startFrame")
    this.endFrame = this.getAttribute("endFrame")
  }

  connectedCallback() {
    this.getProperties()
    this.innerHTML = this.render()
  }

  render() {
    return `
      <div style="height: ${this.duration * 10}px; width: 100%; background: yellow">
        ${this.title} - ${this.startFrame} - ${this.endFrame}
      </div>
  `
  }
}

customElements.define('task-element', TaskElement);