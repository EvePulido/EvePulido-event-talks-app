// App State
let allReleases = [];
let activeFilters = {
    search: '',
    category: 'all'
};
let selectedItem = null;

// DOM Elements
const releasesContainer = document.getElementById('releases-container');
const loadingState = document.getElementById('loading-state');
const errorState = document.getElementById('error-state');
const errorMessage = document.getElementById('error-message');
const emptyState = document.getElementById('empty-state');

const searchInput = document.getElementById('search-input');
const filterBadges = document.getElementById('filter-badges');

const statTotal = document.getElementById('stat-total');
const statFeatures = document.getElementById('stat-features');

const refreshBtn = document.getElementById('refresh-btn');
const refreshBtnText = document.getElementById('refresh-btn-text');
const spinner = document.getElementById('spinner');
const lastUpdatedTime = document.getElementById('last-updated-time');
const retryBtn = document.getElementById('retry-btn');

// Modal Elements
const tweetModal = document.getElementById('tweet-modal');
const closeModalBtn = document.getElementById('close-modal-btn');
const tweetTextarea = document.getElementById('tweet-textarea');
const tweetTextLive = document.getElementById('tweet-text-live');
const mockTweetDate = document.getElementById('mock-tweet-date');
const charCount = document.getElementById('char-count');
const progressCircle = document.getElementById('progress-circle');
const charCounterContainer = document.querySelector('.char-counter');
const resetTweetBtn = document.getElementById('reset-tweet-btn');
const copyBtn = document.getElementById('copy-btn');
const postTweetBtn = document.getElementById('post-tweet-btn');

// Toast Elements
const toast = document.getElementById('toast');
const toastMessage = document.getElementById('toast-message');

/* ==========================================================================
   INITIALIZATION & EVENT LISTENERS
   ========================================================================== */
document.addEventListener('DOMContentLoaded', () => {
    // Initial fetch
    fetchReleases();

    // Event Listeners for Filters
    searchInput.addEventListener('input', (e) => {
        activeFilters.search = e.target.value.toLowerCase().strip();
        renderReleases();
    });

    filterBadges.addEventListener('click', (e) => {
        if (e.target.classList.contains('filter-badge')) {
            // Update active state in UI
            document.querySelectorAll('.filter-badge').forEach(badge => badge.classList.remove('active'));
            e.target.classList.add('active');

            // Apply filter
            activeFilters.category = e.target.dataset.filter;
            renderReleases();
        }
    });

    // Refresh controls
    refreshBtn.addEventListener('click', () => refreshFeed());
    retryBtn.addEventListener('click', () => refreshFeed());

    // Modal controls
    closeModalBtn.addEventListener('click', closeTweetModal);
    tweetModal.addEventListener('click', (e) => {
        if (e.target === tweetModal) closeTweetModal();
    });
    
    // Live tweet character counting & preview
    tweetTextarea.addEventListener('input', handleTweetTextareaChange);
    
    resetTweetBtn.addEventListener('click', () => {
        if (selectedItem) {
            const defaultTweet = generateDefaultTweet(selectedItem);
            tweetTextarea.value = defaultTweet;
            updateTweetPreview(defaultTweet);
        }
    });

    copyBtn.addEventListener('click', copyTweetText);
    postTweetBtn.addEventListener('click', postToX);
});

// Polyfill helper for stripping whitespace
String.prototype.strip = function() {
    return this.trim();
};

/* ==========================================================================
   DATA FETCHING
   ========================================================================== */
async function fetchReleases(forceRefresh = false) {
    try {
        showLoading(true);
        showError(false);

        const url = `/api/releases${forceRefresh ? '?refresh=true' : ''}`;
        const response = await fetch(url);
        const data = await response.json();

        if (data.success) {
            allReleases = data.items;
            
            // Format current local time or cached time
            const now = new Date();
            const formattedTime = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            lastUpdatedTime.textContent = `Last synced: ${formattedTime}`;
            
            renderReleases();
            
            if (forceRefresh) {
                showToast("Release notes feed updated successfully!");
            }
        } else {
            throw new Error(data.error || 'Failed to fetch releases.');
        }
    } catch (err) {
        console.error('Fetch error:', err);
        showError(true, err.message);
        if (forceRefresh) {
            showToast("Failed to refresh feed. Showing cached data if available.");
        }
    } finally {
        showLoading(false);
    }
}

async function refreshFeed() {
    // Add spinner rotation class and disable button
    refreshBtn.classList.add('spinning');
    refreshBtn.disabled = true;
    refreshBtnText.textContent = 'Updating...';

    await fetchReleases(true);

    refreshBtn.classList.remove('spinning');
    refreshBtn.disabled = false;
    refreshBtnText.textContent = 'Refresh Feed';
}

/* ==========================================================================
   RENDERING & FILTERING
   ========================================================================== */
function renderReleases() {
    // Filter items
    const filtered = allReleases.filter(item => {
        // Search filter
        const textContent = (item.type + ' ' + item.date + ' ' + item.content).toLowerCase();
        const matchesSearch = textContent.includes(activeFilters.search);

        // Category filter
        const matchesCategory = activeFilters.category === 'all' || 
                                item.type.toLowerCase() === activeFilters.category;

        return matchesSearch && matchesCategory;
    });

    // Update Stats
    statTotal.textContent = allReleases.length;
    const featuresCount = allReleases.filter(item => item.type.toLowerCase() === 'feature').length;
    statFeatures.textContent = featuresCount;

    // Clear Container
    releasesContainer.innerHTML = '';

    // Show empty state if no items
    if (filtered.length === 0) {
        emptyState.classList.remove('hidden');
        releasesContainer.classList.add('hidden');
        return;
    }

    emptyState.classList.add('hidden');
    releasesContainer.classList.remove('hidden');

    // Generate Release Cards
    filtered.forEach((item, index) => {
        const typeClass = item.type.toLowerCase();
        const card = document.createElement('div');
        card.className = `release-card category-${typeClass}`;
        card.style.animationDelay = `${index * 0.05}s`;

        // Parse HTML content safe display and clean styling
        card.innerHTML = `
            <div class="card-header">
                <div class="card-meta">
                    <span class="card-badge badge-${typeClass}">${item.type}</span>
                    <span class="card-date">${item.date}</span>
                </div>
                <div class="card-actions">
                    <button class="btn-tweet" aria-label="Tweet about this update">
                        <svg viewBox="0 0 24 24" fill="currentColor">
                            <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                        </svg>
                        Share
                    </button>
                </div>
            </div>
            <div class="card-content">
                ${item.content}
            </div>
        `;

        // Event listener for Share button
        const shareBtn = card.querySelector('.btn-tweet');
        shareBtn.addEventListener('click', () => openTweetModal(item));

        releasesContainer.appendChild(card);
    });
}

function showLoading(show) {
    if (show) {
        loadingState.classList.remove('hidden');
        releasesContainer.classList.add('hidden');
    } else {
        loadingState.classList.add('hidden');
    }
}

function showError(show, message = '') {
    if (show) {
        errorState.classList.remove('hidden');
        errorMessage.textContent = message;
        releasesContainer.classList.add('hidden');
    } else {
        errorState.classList.add('hidden');
    }
}

/* ==========================================================================
   TWEET GENERATION & MOCK PREVIEW LOGIC
   ========================================================================== */
function generateDefaultTweet(item) {
    // We parse the HTML content to plain text to make it readable in a tweet
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = item.content;
    
    // Clean up code blocks to look nice in text
    tempDiv.querySelectorAll('code').forEach(el => {
        el.textContent = `\`${el.textContent}\``;
    });

    let plainText = tempDiv.textContent || tempDiv.innerText || '';
    
    // Clean up excessive whitespace
    plainText = plainText.replace(/\s+/g, ' ').strip();

    // Define fixed portions of tweet
    const header = `BigQuery Update [${item.date}] (${item.type}):\n`;
    const footer = `\n\nDetails: ${item.link}\n#BigQuery #GCP`;
    
    const maxChars = 280;
    const reservedLength = header.length + footer.length;
    const availableLength = maxChars - reservedLength;

    if (plainText.length > availableLength) {
        // Truncate plain text to fit available space
        plainText = plainText.substring(0, availableLength - 3) + '...';
    }

    return `${header}${plainText}${footer}`;
}

function openTweetModal(item) {
    selectedItem = item;
    
    // Format mock tweet date
    mockTweetDate.textContent = item.date;
    
    // Generate default text
    const defaultTweet = generateDefaultTweet(item);
    tweetTextarea.value = defaultTweet;
    
    // Update live previews
    updateTweetPreview(defaultTweet);
    
    // Display Modal
    tweetModal.classList.remove('hidden');
    document.body.style.overflow = 'hidden'; // Lock background scroll
}

function closeTweetModal() {
    tweetModal.classList.add('hidden');
    document.body.style.overflow = ''; // Unlock scroll
    selectedItem = null;
}

function handleTweetTextareaChange(e) {
    const text = e.target.value;
    updateTweetPreview(text);
}

function updateTweetPreview(text) {
    // Update text content in the X mock card preview
    // Replace URL links with highlights
    let htmlText = text
        .replace(/(https?:\/\/[^\s]+)/g, '<span style="color: var(--tweet-color); font-weight: 500;">$1</span>')
        .replace(/(#[a-zA-Z0-9_]+)/g, '<span style="color: var(--tweet-color); font-weight: 500;">$1</span>')
        .replace(/(@[a-zA-Z0-9_]+)/g, '<span style="color: var(--tweet-color); font-weight: 500;">$1</span>');
    
    tweetTextLive.innerHTML = htmlText;

    // Character Counter & Ring Progress Logic
    const currentLength = text.length;
    const maxLength = 280;
    charCount.textContent = currentLength;

    // Circular progress formula
    // r = 8, circumference = 2 * PI * r = 50.24
    const circumference = 50.24;
    const ratio = Math.min(currentLength / maxLength, 1);
    const offset = circumference - (ratio * circumference);
    progressCircle.style.strokeDashoffset = offset;

    // Stylize based on character limit warnings
    charCounterContainer.classList.remove('warning', 'danger');
    postTweetBtn.disabled = false;

    if (currentLength >= maxLength) {
        charCounterContainer.classList.add('danger');
        // If it goes beyond 280, disable the Twitter button
        if (currentLength > maxLength) {
            postTweetBtn.disabled = true;
        }
    } else if (currentLength >= 260) {
        charCounterContainer.classList.add('warning');
    }
}

function copyTweetText() {
    const textToCopy = tweetTextarea.value;
    navigator.clipboard.writeText(textToCopy)
        .then(() => {
            showToast("Copied to Clipboard!");
        })
        .catch(err => {
            console.error('Failed to copy text: ', err);
            showToast("Failed to copy text.");
        });
}

function postToX() {
    const text = tweetTextarea.value;
    if (text.length > 280) {
        showToast("Error: Tweet exceeds the 280-character limit.");
        return;
    }
    const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`;
    window.open(twitterUrl, '_blank', 'width=550,height=420');
}

/* ==========================================================================
   TOAST SYSTEM
   ========================================================================== */
let toastTimeout;
function showToast(message) {
    clearTimeout(toastTimeout);
    toastMessage.textContent = message;
    toast.classList.remove('hidden');
    
    // Auto-hide toast after 3 seconds
    toastTimeout = setTimeout(() => {
        toast.classList.add('hidden');
    }, 3000);
}
