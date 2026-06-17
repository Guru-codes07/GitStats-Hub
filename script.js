document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements
    const searchForm = document.getElementById('search-form');
    const searchInput = document.getElementById('search-input');
    const themeToggle = document.getElementById('theme-toggle');
    const searchHistory = document.getElementById('search-history');
    const historyTags = document.getElementById('history-tags');
    const clearHistoryBtn = document.getElementById('clear-history');
    const errorContainer = document.getElementById('error-container');
    const errorTitle = document.getElementById('error-title');
    const errorMessage = document.getElementById('error-message');
    const dashboard = document.getElementById('dashboard');
    const skeletonLoader = document.getElementById('skeleton-loader');
    
    // Profile DOM Elements
    const profileAvatar = document.getElementById('profile-avatar');
    const profileName = document.getElementById('profile-name');
    const profileLogin = document.getElementById('profile-login');
    const profileBio = document.getElementById('profile-bio');
    const profileJoined = document.getElementById('profile-joined');
    const profileLocation = document.getElementById('profile-location');
    const profileCompany = document.getElementById('profile-company');
    const profileBlog = document.getElementById('profile-blog');
    const profileGithubLink = document.getElementById('profile-github-link');
    const copyLinkBtn = document.getElementById('copy-link-btn');
    
    // Stats DOM Elements
    const statFollowers = document.getElementById('stat-followers');
    const statFollowing = document.getElementById('stat-following');
    const statRepos = document.getElementById('stat-repos');
    
    // Repos & Languages Containers
    const languagesContainer = document.getElementById('languages-container');
    const topReposList = document.getElementById('top-repos-list');
    const recentReposList = document.getElementById('recent-repos-list');

    // State
    let currentProfileUrl = '';
    const maxHistoryCount = 6;
    
    // Popular programming languages colors map
    const languageColors = {
        javascript: '#f1e05a',
        typescript: '#3178c6',
        html: '#e34c26',
        css: '#563d7c',
        python: '#3572a5',
        java: '#b07219',
        go: '#00add8',
        'c++': '#f34b7d',
        c: '#555555',
        ruby: '#701516',
        rust: '#dea584',
        php: '#4f5d95',
        swift: '#f05138',
        kotlin: '#a97bff',
        shell: '#89e051',
        dart: '#00b4ab',
        vue: '#41b883',
        objective: '#438eff'
    };

    /**
     * Initialize the Application
     */
    function init() {
        initTheme();
        initSearchHistory();
        
        // Load default user profile on initial load
        fetchUserProfile('octocat');
    }

    /* ==========================================================================
       THEME MANAGEMENT
       ========================================================================== */
    function initTheme() {
        const storedTheme = localStorage.getItem('theme');
        const systemPrefersLight = window.matchMedia('(prefers-color-scheme: light)').matches;
        
        if (storedTheme) {
            document.documentElement.setAttribute('data-theme', storedTheme);
        } else if (systemPrefersLight) {
            document.documentElement.setAttribute('data-theme', 'light');
        } else {
            document.documentElement.setAttribute('data-theme', 'dark');
        }
        
        themeToggle.addEventListener('click', toggleTheme);
    }

    function toggleTheme() {
        const currentTheme = document.documentElement.getAttribute('data-theme');
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
        
        document.documentElement.setAttribute('data-theme', newTheme);
        localStorage.setItem('theme', newTheme);
    }

    /* ==========================================================================
       SEARCH HISTORY MANAGEMENT
       ========================================================================== */
    function initSearchHistory() {
        renderSearchHistory();
        
        clearHistoryBtn.addEventListener('click', () => {
            localStorage.removeItem('search_history');
            renderSearchHistory();
        });
    }

    function getHistory() {
        const history = localStorage.getItem('search_history');
        return history ? JSON.parse(history) : [];
    }

    function addToHistory(username) {
        if (!username) return;
        
        let history = getHistory();
        
        // Remove username if it already exists to put it at the start
        history = history.filter(user => user.toLowerCase() !== username.toLowerCase());
        
        // Add to the front
        history.unshift(username);
        
        // Trim history list to max capacity
        if (history.length > maxHistoryCount) {
            history = history.slice(0, maxHistoryCount);
        }
        
        localStorage.setItem('search_history', JSON.stringify(history));
        renderSearchHistory();
    }

    function renderSearchHistory() {
        const history = getHistory();
        
        if (history.length === 0) {
            searchHistory.classList.add('hidden');
            return;
        }
        
        searchHistory.classList.remove('hidden');
        historyTags.innerHTML = '';
        
        history.forEach(username => {
            const tag = document.createElement('button');
            tag.className = 'history-tag';
            tag.textContent = username;
            tag.type = 'button';
            tag.addEventListener('click', () => {
                searchInput.value = username;
                fetchUserProfile(username);
            });
            historyTags.appendChild(tag);
        });
    }

    /* ==========================================================================
       DATA FETCHING & LOADING MANAGEMENT
       ========================================================================== */
    async function fetchUserProfile(username) {
        if (!username || username.trim() === '') {
            showError('Please enter a username', 'Input cannot be empty.');
            return;
        }

        const trimmedUser = username.trim();
        showLoading(true);

        try {
            // Request User Details & Repositories concurrently
            const [userRes, reposRes] = await Promise.all([
                fetch(`https://api.github.com/users/${trimmedUser}`),
                fetch(`https://api.github.com/users/${trimmedUser}/repos?per_page=100`)
            ]);

            // Handle API errors
            if (userRes.status === 404) {
                showError('User Not Found', `We couldn't find any GitHub user matching "${trimmedUser}".`);
                showLoading(false);
                return;
            }

            if (userRes.status === 403 || reposRes.status === 403) {
                showError('Rate Limit Exceeded', 'The GitHub API rate limit has been exceeded. Please try again in a little while.');
                showLoading(false);
                return;
            }

            if (!userRes.ok || !reposRes.ok) {
                showError('Something Went Wrong', 'An error occurred while fetching the profile data. Please try again.');
                showLoading(false);
                return;
            }

            const userData = await userRes.json();
            const reposData = await reposRes.json();

            // Populate page content
            displayProfile(userData);
            displayReposAndLanguages(reposData);
            
            // Add successful search to history cache
            addToHistory(userData.login);
            
            // Render dashboard view
            showLoading(false);

        } catch (err) {
            console.error(err);
            showError('Network Error', 'Could not connect to GitHub. Please check your internet connection and try again.');
            showLoading(false);
        }
    }

    function showLoading(isLoading) {
        if (isLoading) {
            skeletonLoader.classList.remove('hidden');
            dashboard.classList.add('hidden');
            errorContainer.classList.add('hidden');
        } else {
            skeletonLoader.classList.add('hidden');
        }
    }

    function showError(title, message) {
        errorTitle.textContent = title;
        errorMessage.textContent = message;
        errorContainer.classList.remove('hidden');
        dashboard.classList.add('hidden');
        skeletonLoader.classList.add('hidden');
    }

    /* ==========================================================================
       RENDERING LOGIC
       ========================================================================== */
    function displayProfile(user) {
        // Display avatar & names
        profileAvatar.src = user.avatar_url;
        profileAvatar.alt = `${user.name || user.login}'s profile picture`;
        profileName.textContent = user.name || user.login;
        profileLogin.textContent = user.login;
        
        // Current profile URL for copying
        currentProfileUrl = user.html_url;
        profileGithubLink.href = user.html_url;

        // Display Bio or default placeholder
        if (user.bio) {
            profileBio.textContent = user.bio;
            profileBio.classList.remove('hidden');
        } else {
            profileBio.textContent = 'This developer has not provided a biography yet.';
        }

        // Account Creation Date Formatting
        const createDate = new Date(user.created_at);
        const options = { year: 'numeric', month: 'short', day: 'numeric' };
        profileJoined.textContent = createDate.toLocaleDateString('en-US', options);

        // Location Info
        const locationContainer = document.getElementById('meta-location-container');
        if (user.location) {
            profileLocation.textContent = user.location;
            locationContainer.classList.remove('hidden');
        } else {
            locationContainer.classList.add('hidden');
        }

        // Company Info
        const companyContainer = document.getElementById('meta-company-container');
        if (user.company) {
            // Remove '@' symbol from company string if present for cleaner presentation
            profileCompany.textContent = user.company.replace(/^@/, '');
            companyContainer.classList.remove('hidden');
        } else {
            companyContainer.classList.add('hidden');
        }

        // Blog / Website Link
        const blogContainer = document.getElementById('meta-blog-container');
        if (user.blog) {
            // Clean URL formatting
            let cleanBlogUrl = user.blog;
            if (!/^https?:\/\//i.test(cleanBlogUrl)) {
                cleanBlogUrl = 'https://' + cleanBlogUrl;
            }
            profileBlog.textContent = user.blog.replace(/^https?:\/\/(www\.)?/i, '');
            profileBlog.href = cleanBlogUrl;
            blogContainer.classList.remove('hidden');
        } else {
            blogContainer.classList.add('hidden');
        }

        // Key stats numbers
        statFollowers.textContent = formatStatNumber(user.followers);
        statFollowing.textContent = formatStatNumber(user.following);
        statRepos.textContent = formatStatNumber(user.public_repos);

        // Enable profile display
        dashboard.classList.remove('hidden');
    }

    function displayReposAndLanguages(repos) {
        // Clear containers
        languagesContainer.innerHTML = '';
        topReposList.innerHTML = '';
        recentReposList.innerHTML = '';

        if (!repos || repos.length === 0) {
            topReposList.innerHTML = '<p class="empty-repos-text">No public repositories found.</p>';
            recentReposList.innerHTML = '<p class="empty-repos-text">No public repositories found.</p>';
            languagesContainer.innerHTML = '<p class="empty-repos-text" style="grid-column: 1 / -1;">No languages detected.</p>';
            return;
        }

        // 1. Language Breakdown Analysis
        const languagesCount = {};
        let totalReposWithLanguages = 0;

        repos.forEach(repo => {
            if (repo.language) {
                const lang = repo.language;
                languagesCount[lang] = (languagesCount[lang] || 0) + 1;
                totalReposWithLanguages++;
            }
        });

        // Convert language occurrences to percentages & sort desc
        const sortedLanguages = Object.keys(languagesCount)
            .map(lang => {
                const count = languagesCount[lang];
                const pct = ((count / totalReposWithLanguages) * 100).toFixed(1);
                return {
                    name: lang,
                    count: count,
                    percentage: parseFloat(pct)
                };
            })
            .sort((a, b) => b.count - a.count)
            .slice(0, 4); // Display top 4 languages

        if (sortedLanguages.length > 0) {
            sortedLanguages.forEach(lang => {
                const langKey = lang.name.toLowerCase();
                const color = languageColors[langKey] || getRandomColor();
                
                const langItem = document.createElement('div');
                langItem.className = 'lang-item';
                langItem.innerHTML = `
                    <div class="lang-label-group">
                        <div class="lang-name-wrapper">
                            <span class="lang-dot" style="background-color: ${color}; box-shadow: 0 0 8px ${color}80;"></span>
                            <span>${lang.name}</span>
                        </div>
                        <span class="lang-pct">${lang.percentage}%</span>
                    </div>
                    <div class="lang-bar-bg">
                        <div class="lang-bar-fill" style="width: 0%; background-color: ${color}; box-shadow: 0 0 6px ${color}40;"></div>
                    </div>
                `;
                languagesContainer.appendChild(langItem);
                
                // Animate progress bar fill width (micro-animation delay)
                setTimeout(() => {
                    const fillBar = langItem.querySelector('.lang-bar-fill');
                    if (fillBar) {
                        fillBar.style.width = `${lang.percentage}%`;
                    }
                }, 100);
            });
        } else {
            languagesContainer.innerHTML = '<p class="empty-repos-text" style="grid-column: 1 / -1;">No programming languages detected in public repos.</p>';
        }

        // 2. Top Repositories (Sorted by Stars)
        const starredRepos = [...repos]
            .sort((a, b) => b.stargazers_count - a.stargazers_count)
            .slice(0, 5);

        starredRepos.forEach(repo => {
            topReposList.appendChild(createRepoItem(repo));
        });

        // 3. Recent Repositories (Sorted by Creation Date)
        const recentRepos = [...repos]
            .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
            .slice(0, 5);

        recentRepos.forEach(repo => {
            recentReposList.appendChild(createRepoItem(repo));
        });
    }

    function createRepoItem(repo) {
        const repoItem = document.createElement('div');
        repoItem.className = 'repo-item';
        
        const langKey = repo.language ? repo.language.toLowerCase() : '';
        const langColor = languageColors[langKey] || '#8b5cf6';
        
        repoItem.innerHTML = `
            <a href="${repo.html_url}" target="_blank" rel="noopener noreferrer" class="repo-name-link">
                <span>${repo.name}</span>
                <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="flex-shrink:0;">
                    <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
                    <polyline points="15 3 21 3 21 9"></polyline>
                    <line x1="10" y1="14" x2="21" y2="3"></line>
                </svg>
            </a>
            <p class="repo-desc">${repo.description || 'No description provided.'}</p>
            <div class="repo-meta">
                ${repo.language ? `
                    <div class="repo-meta-item">
                        <span class="lang-dot" style="background-color: ${langColor}; width: 8px; height: 8px;"></span>
                        <span>${repo.language}</span>
                    </div>
                ` : ''}
                <div class="repo-meta-item star">
                    <svg viewBox="0 0 24 24" width="12" height="12" fill="currentColor" stroke="currentColor" stroke-width="1.5">
                        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
                    </svg>
                    <span>${repo.stargazers_count}</span>
                </div>
                <div class="repo-meta-item fork">
                    <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                        <circle cx="12" cy="18" r="3"></circle>
                        <circle cx="6" cy="6" r="3"></circle>
                        <circle cx="18" cy="6" r="3"></circle>
                        <path d="M18 9v2a4 4 0 0 1-4 4H10"></path>
                        <line x1="6" y1="9" x2="6" y2="15"></line>
                    </svg>
                    <span>${repo.forks_count}</span>
                </div>
            </div>
        `;
        return repoItem;
    }

    /* ==========================================================================
       HELPER UTILITIES
       ========================================================================== */
    function formatStatNumber(num) {
        if (num >= 1000000) {
            return (num / 1000000).toFixed(1).replace(/\.0$/, '') + 'M';
        }
        if (num >= 1000) {
            return (num / 1000).toFixed(1).replace(/\.0$/, '') + 'k';
        }
        return num;
    }

    function getRandomColor() {
        const letters = '0123456789ABCDEF';
        let color = '#';
        for (let i = 0; i < 6; i++) {
            color += letters[Math.floor(Math.random() * 16)];
        }
        return color;
    }

    /* ==========================================================================
       INTERACTIVE BINDINGS & ACTIONS
       ========================================================================== */
    // Search Form Submit Handler
    searchForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const query = searchInput.value;
        if (query) {
            fetchUserProfile(query);
        }
    });

    // Copy Profile URL Action
    copyLinkBtn.addEventListener('click', async () => {
        if (!currentProfileUrl) return;

        try {
            await navigator.clipboard.writeText(currentProfileUrl);
            
            // Transition to copy success state
            const btnText = copyLinkBtn.querySelector('.btn-text');
            const copyIcon = copyLinkBtn.querySelector('.copy-icon');
            const checkIcon = copyLinkBtn.querySelector('.check-icon');
            
            btnText.textContent = 'Copied!';
            copyIcon.classList.add('hidden');
            checkIcon.classList.remove('hidden');
            copyLinkBtn.style.borderColor = '#10b981';
            
            // Reset state after 2 seconds
            setTimeout(() => {
                btnText.textContent = 'Copy URL';
                copyIcon.classList.remove('hidden');
                checkIcon.classList.add('hidden');
                copyLinkBtn.style.borderColor = '';
            }, 2000);

        } catch (err) {
            console.error('Failed to copy to clipboard: ', err);
        }
    });

    // Start App
    init();
});

