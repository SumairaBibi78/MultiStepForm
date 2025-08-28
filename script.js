// Constants and State
const form = document.getElementById('multiStepForm');
const steps = Array.from(document.querySelectorAll('.form-step'));
const stepBtns = document.querySelectorAll('.step-btn');
const progressBar = document.getElementById('progress-bar');
const lockMsgEl = document.getElementById('lockMessage');
const saveBtn = document.getElementById('saveDraft');
const loadBtn = document.getElementById('loadDraft');
const lastSavedLabel = document.getElementById('lastSaved');
const themeToggle = document.getElementById('theme-toggle');

let currentStep = 1;
let isFilled = false;
const totalSteps = stepBtns.length;
const userId = 'user-123'; // Replace with real unique ID

// Initialize
document.addEventListener('DOMContentLoaded', () => {
  loadTheme(); 
  updateProgressUI(currentStep);
  autoSave();
});

// Theme Persistence
themeToggle.addEventListener('click', () => {
  document.body.classList.toggle('dark');
  document.body.classList.toggle('light');
  localStorage.setItem('theme', document.body.classList.contains('dark') ? 'dark' : 'light');
  themeToggle.textContent = document.body.classList.contains('dark') ? '☀️' : '🌙';
});
function loadTheme() {
  const saved = localStorage.getItem('theme') || 'light';
  document.body.classList.add(saved);
  themeToggle.textContent = saved === 'dark' ? '☀️' : '🌙';
}

//update UI whenever currentStep changes
function updateProgressUI(step) {
  currentStep = step;

  //progress bar fill
  const percent = ((step-1)/(totalSteps-1)) * 100;
  progressBar.style.width = `${percent}%`;

  //update each button
  stepBtns.forEach((btn, idx) => {
    const num = idx + 1;
    btn.classList.remove('active', 'completed', 'locked');

    if (num < step) {
      btn.classList.add('completed');
      btn.textContent = num;
    }
    else if (num === step) {
      btn.classList.add('active');
      btn.textContent = num;
    }
    else {
      btn.classList.add('locked');
      btn.textContent = '🔒';
    }
  });
}

//show a toast for loacked clicks
let lockTimeout;
function showLockMessage(text) {
  lockMsgEl.textContent = text;
  lockMsgEl.classList.add('show');

  clearTimeout(lockTimeout);
  lockTimeout = setTimeout(() => { lockMsgEl.classList.remove('show'); }, 1000);
}

//wire up clicks
stepBtns.forEach(btn => {
  btn.addEventListener('click', () => {
    const step = Number(btn.dataset.step);

    if (step <= currentStep) { updateProgressUI(step); goToStep(step); }
    else { showLockMessage(`Step ${step} is locked`); }
  });
});
document.querySelectorAll('#nextBtn1, #nextBtn2').forEach(btn => {
  btn.addEventListener('click', () => validateAndNext());
});
document.querySelectorAll('.prevBtn').forEach(btn => {
  btn.addEventListener('click', () => goToStep(currentStep - 1));
});

// Form Change Handler
form.addEventListener('input', () => {
  isFilled = true;
});

// Validate & Next
function validateAndNext() {
  const stepEl = steps[currentStep - 1];
  const fields = Array.from(stepEl.querySelectorAll('input[required]'));
  let firstInvalid = null;

  // Clear previous errors
  fields.forEach(f => f.nextElementSibling.textContent = '');

  // Find & mark invalid fields
  fields.forEach(field => {
    if (!field.checkValidity()) {
      const msgEl = field.nextElementSibling;
      msgEl.textContent = field.validationMessage;
      if (!firstInvalid) firstInvalid = field;
    }
  });

  // If we found an invalid field, focus it and stop
  if (firstInvalid) {
    firstInvalid.focus();
    return;
  }

  // all good → advance
  goToStep(currentStep + 1);
}

// Step Navigation Logic
function goToStep(step) {
  if (step < 1 || step > steps.length) return;

  //hide all steps
  steps.forEach(s => s.classList.remove('active'));

  //show only the selected step
  steps[step - 1].classList.add('active');

  //update current step and progress UI
  currentStep = step;
  updateProgressUI(currentStep);

  //Render summary
  if (step === steps.length) renderSummary();
}

// Summary Rendering
function renderSummary() {
  const summaryEl = document.getElementById('summary');
  const data = new FormData(form);
  let html = '<ul>';
  data.forEach((val, key) => {
    html += `<li><strong>${key}:</strong> ${val}</li>`;
  });
  html += '</ul>';
  summaryEl.innerHTML = html;
}

// Draft Management
saveBtn.addEventListener('click', () => {
  localStorage.setItem(userId, JSON.stringify(getFormData()));
  markSaved();
});
loadBtn.addEventListener('click', () => {
  const draft = JSON.parse(localStorage.getItem(userId) || '{}');
  if (Object.keys(draft).length) {
    setFormData(draft);
  }
});

// Autosave every 10s if dirty
function autoSave() {
  setInterval(() => {
    if (isFilled) {
      localStorage.setItem(userId, JSON.stringify(getFormData()));
      markSaved();
    }
  }, 10000);
}

// Track last save
function markSaved() {
  isFilled = false;
  lastSavedLabel.textContent = `Last saved at ${new Date().toLocaleTimeString()}`;
}

// Gather and Restore Data
function getFormData() {
  const data = {};
  new FormData(form).forEach((v, k) => (data[k] = v));
  data.currentStep = currentStep;
  return data;
}
function setFormData(data) {
  for (let key in data) {
    if (key === 'currentStep') continue;
    const field = form.elements[key];
    if (field) field.value = data[key];
  }
  goToStep(data.currentStep || 1);
}

// Unsaved Changes Warning
window.addEventListener('beforeunload', e => {
  if (isFilled) {
    e.preventDefault();
    e.returnValue = '';
  }
});

// Final Submission
form.addEventListener('submit', e => {
  e.preventDefault();
  alert('Form submitted successfully!');
  localStorage.removeItem(userId);
});