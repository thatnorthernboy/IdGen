// --- DOM Elements ---
const ideaDisplay = document.getElementById('idea-display');
const generateBtn = document.getElementById('generate-btn');
const btnText = document.getElementById('btn-text');
const loader = document.getElementById('loader');
const errorBox = document.getElementById('error-box');
const errorMessage = document.getElementById('error-message');
const categoryContainer = document.getElementById('category-container');

// --- State ---
let selectedCategory = 'General'; // Default category

// --- Functions ---

/**
 * Fetches a new idea by calling our secure Netlify serverless function.
 */
async function generateNewIdea() {
    // Show loading state and disable the button
    setLoading(true);
    hideError();

    // Add a fade-out effect
    ideaDisplay.style.opacity = 0;

    try {
        // The API endpoint is now our own serverless function.
        // Netlify automatically knows that /api/ points to your functions folder.
        const response = await fetch('/api/get-idea', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            // Send the selected category to our function
            body: JSON.stringify({ category: selectedCategory }),
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || `Request failed with status ${response.status}`);
        }

        const result = await response.json();
        const ideaText = result.idea;
        
        // Update the text and fade it back in after 300ms
        setTimeout(() => {
            ideaDisplay.textContent = ideaText;
            ideaDisplay.style.opacity = 1;
        }, 300);

    } catch (error) {
        console.error("Error generating idea:", error);
        showError(error.message || "An unknown error occurred.");
        // Restore a default message on error
        ideaDisplay.textContent = "Error fetching idea. Try again.";
        ideaDisplay.style.opacity = 1;
    } finally {
        // Hide loading state and re-enable the button
        setLoading(false);
    }
}

/**
 * Toggles the loading state of the generate button.
 * @param {boolean} isLoading - Whether to show the loading state.
 */
function setLoading(isLoading) {
    generateBtn.disabled = isLoading;
    if (isLoading) {
        btnText.textContent = "Generating...";
        loader.classList.remove('hidden');
    } else {
        btnText.textContent = "Generate New Idea";
        loader.classList.add('hidden');
    }
}

/**
 * Shows an error message in the UI.
 * @param {string} message - The error message to display.
 */
function showError(message) {
    errorMessage.textContent = message;
    errorBox.classList.remove('hidden');
}

/**
 * Hides the error message box.
 */
function hideError() {
    errorBox.classList.add('hidden');
}

/**
 * Handles clicks on the category buttons.
 * @param {Event} e - The click event.
 */
function handleCategorySelection(e) {
    const clickedButton = e.target.closest('.category-btn');
    if (!clickedButton) return;

    // Remove 'active' class from all buttons
    document.querySelectorAll('.category-btn').forEach(btn => {
        btn.classList.remove('active');
    });

    // Add 'active' class to the clicked button
    clickedButton.classList.add('active');

    // Update the selected category
    selectedCategory = clickedButton.dataset.category;
}


// --- Event Listeners ---
generateBtn.addEventListener('click', generateNewIdea);
categoryContainer.addEventListener('click', handleCategorySelection);
