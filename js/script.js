/**
 * [카카오 실시간 검색] 관련 설정 및 함수
 */
const KAKAO_API_KEY = "442ebf9f7285d9ec8bec491e3d33d712"; // 제이님이 발급받은 키
const KAKAO_API_URL = "https://dapi.kakao.com/v3/search/book";

// 1. 검색 버튼 및 입력창 요소 가져오기
const searchInput = document.getElementById('kakao-search-input');
const searchBtn = document.getElementById('kakao-search-btn');
const kakaoGrid = document.getElementById('kakao-book-grid');
const queryDisplay = document.querySelector('.kakao-query');

// 2. 검색 실행 함수
function searchKakaoBooks() {
    const query = searchInput.value.trim(); // 앞뒤 공백 제거

    if (!query) {
        alert("검색어를 입력해주세요!");
        return;
    }
    
    // 화면의 검색어 텍스트 업데이트 ("파이썬" -> 입력한 검색어)
    if (queryDisplay) queryDisplay.innerText = `"${query}"`;
    
    // 화면의 검색어 텍스트 업데이트 ("파이썬" -> 입력한 검색어)
    if (queryDisplay) queryDisplay.innerText = `"${query}"`;

    // 카카오 API 호출
    fetch(`${KAKAO_API_URL}?query=${encodeURIComponent(query)}&size=10`, {
        method: "GET",
        headers: {
            "Authorization": `KakaoAK ${KAKAO_API_KEY}`
        }
    })
    .then(res => res.json())
    .then(data => {
        const books = data.documents;
        renderKakaoList(books); // 검색 결과를 화면에 뿌려주는 함수 호출
    })
    .catch(err => {
        console.error("API 호출 중 오류 발생:", err);
        kakaoGrid.innerHTML = "<p>검색 결과를 가져오는 중 오류가 발생했습니다.</p>";
    });
}

// 3. 검색 결과를 HTML로 변환하여 출력하는 함수
function renderKakaoList(books) {
    if (!books || books.length === 0) {
        kakaoGrid.innerHTML = "<p>검색 결과가 없습니다.</p>";
        return;
    }

    kakaoGrid.innerHTML = books.map(book => {
        // 썸네일 보안 및 대체 이미지 처리
        let thumbImg = book.thumbnail;
        if (thumbImg && thumbImg.startsWith('http:')) {
            thumbImg = thumbImg.replace('http:', 'https:');
        }
        if (!thumbImg) thumbImg = 'https://via.placeholder.com/120x174?text=No+Image';

        return `
            <article class="kakao-book-card">
                <div class="kakao-thumb-box">
                    <img src="${thumbImg}" alt="${book.title}" onerror="this.src='https://via.placeholder.com/120x174?text=Error'">
                </div>
                <div class="kakao-info">
                    <h3 class="k-title" title="${book.title}">${book.title}</h3>
                    <p class="k-author">${book.authors.join(', ')}</p>
                    <p class="k-publisher">${book.publisher}</p>
                    <p class="k-price">${book.price.toLocaleString()}원</p>
                </div>
            </article>
        `;
    }).join('');
}

// 4. 이벤트 바인딩 (클릭 및 엔터키)
searchBtn.addEventListener('click', searchKakaoBooks);

searchInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        searchKakaoBooks();
    }
});
document.addEventListener('DOMContentLoaded', () => {
    // JSON 데이터 가져오기
    fetch('./json/data.json')
        .then(response => response.json())
        .then(data => {
            renderBanners(data.banners);
            renderCategories(data.categories);
            renderBooks(data.books.todaysSelection, 'todays-selection');
            renderBooks(data.books.editorsPick, 'editors-pick');
        })
        .catch(error => console.error('데이터 로드 실패:', error));
});

//////메인 slider start
// 상태 관리 변수
let currentIndex = 0; // 현재 보고 있는 슬라이드의 인덱스 (0부터 시작)
let sliderData = []; // JSON에서 가져온 데이터를 담을 배열
let autoSlideTimer; // 자동 재생 타이머를 제어하기 위한 변수

// DOM 요소 참조
const wrapper = document.getElementById('slider-wrapper');
const currentIdxText = document.getElementById('current-idx');
const totalIdxText = document.getElementById('total-idx');

/**
 * 1. 초기 데이터 로드 (JSON)
 */
fetch('./json/data.json')
    .then(res => res.json())
    .then(data => {
        sliderData = data.slider;
        initSlider(); // 데이터 로드 완료 후 초기화 실행

        allBooks = data.books;
        renderTabs(data.categories);
        renderBooks('종합'); // 초기화면은 '종합' 카테고리        
    })
    .catch(err => console.error("데이터 로딩 중 오류 발생:", err));

/**
 * 2. 슬라이더 초기 설정 및 렌더링
 */
function initSlider() {
    totalIdxText.innerText = sliderData.length; // 전체 슬라이드 수 표시
    
    // 슬라이드 HTML 동적 생성
    wrapper.innerHTML = sliderData.map(item => `
        <div class="slide-item" style="background-color: ${item.bgColor}">
            <div class="slide-content">
                <div class="text-area">
                    <h2>${item.title}</h2>
                    <p>${item.subtitle}</p>
                </div>
                <div class="image-area">
                    <img src="${item.image}" alt="${item.title}">
                </div>
            </div>
        </div>
    `).join('');

    // 자동 슬라이드 시작 (2초마다 실행)
    startAutoSlide();

    // 버튼 클릭 이벤트 리스너 등록
    document.getElementById('next-btn').addEventListener('click', () => {
        handleManualControl(nextSlide);
    });

    document.getElementById('prev-btn').addEventListener('click', () => {
        handleManualControl(prevSlide);
    });
}

/**
 * 3. 이동 로직 함수
 */
function updateSlider() {
    // CSS의 transform 속성을 이용해 슬라이더를 가로로 밀어냄
    // 인덱스가 1이면 -100%, 2이면 -200% 위치로 이동
    wrapper.style.transform = `translateX(-${currentIndex * 100}%)`;
    
    // 화면에 표시되는 현재 페이지 번호 업데이트 (인덱스 + 1)
    currentIdxText.innerText = currentIndex + 1;
}

// 다음 슬라이드로 이동 (마지막이면 처음으로)
function nextSlide() {
    currentIndex = (currentIndex + 1 === sliderData.length) ? 0 : currentIndex + 1;
    updateSlider();
}

// 이전 슬라이드로 이동 (처음이면 마지막으로)
function prevSlide() {
    currentIndex = (currentIndex === 0) ? sliderData.length - 1 : currentIndex - 1;
    updateSlider();
}

/**
 * 4. 자동 재생 관리
 */
function startAutoSlide() {
    autoSlideTimer = setInterval(nextSlide, 2000); // 2000ms = 2초
}

// 사용자가 버튼을 클릭했을 때 호출되는 함수
function handleManualControl(actionFunc) {
    clearInterval(autoSlideTimer); // 사용자가 직접 조작할 때는 자동 재생 일시 정지
    actionFunc(); // 전달받은 이동 함수(nextSlide 또는 prevSlide) 실행
    startAutoSlide(); // 조작 완료 후 자동 재생 다시 시작
}
///// main slider end

/// 화제의 신작 시작
/**
 * 글로벌 상태 변수
 */
let allBooks = [];      // 전체 도서 데이터 저장
let currentIdx = 0;     // 슬라이드 현재 위치 인덱스
const itemsToShow = 5;  // 화면에 한 번에 보여줄 도서 개수

const tabsContainer = document.getElementById('category-tabs');
const bookList = document.getElementById('book-list');

// 1. 초기 데이터 로드
/*
fetch('./json/data.json')
    .then(res => res.json())
    .then(data => {
        allBooks = data.books;
        renderTabs(data.categories);
        renderBooks('종합'); // 초기화면은 '종합' 카테고리
    });    */

// 2. 카테고리 탭 렌더링
function renderTabs(categories) {
    tabsContainer.innerHTML = categories.map((cat, idx) => `
        <div class="tab-item ${idx === 0 ? 'active' : ''}" onclick="filterCategory(this, '${cat}')">
            ${cat}
        </div>
    `).join('');
}

// 3. 도서 목록 렌더링
function renderBooks(category) {
    // 카테고리 필터링 ('종합'일 경우 전체 노출)
    const filtered = category === '종합' 
        ? allBooks 
        : allBooks.filter(book => book.category === category);

    // 필터링된 데이터가 없을 경우 예외 처리
    if(filtered.length === 0) {
        bookList.innerHTML = `<p style="padding: 50px;">해당 카테고리의 도서가 없습니다.</p>`;
        return;
    }

    // 카드 생성
    bookList.innerHTML = filtered.map(book => `
        <div class="book-card">
            <div class="book-img-box">
                <img src="${book.image}" alt="${book.title}" onerror="this.src='https://via.placeholder.com/200x300?text=Book'">
                <div class="hover-overlay">
                    <div class="view-cart-btn">View Cart</div>
                </div>
            </div>
            <div class="book-info">
                <p class="title">${book.title}</p>
                <p class="author">${book.author}</p>
            </div>
        </div>
    `).join('');

    // 필터링 시 슬라이드 위치 리셋
    currentIdx = 0;
    bookList.style.transform = `translateX(0)`;
}

// 4. 탭 클릭 이벤트 함수
function filterCategory(element, category) {
    // 모든 탭에서 active 제거 후 클릭한 탭에 추가
    document.querySelectorAll('.tab-item').forEach(tab => tab.classList.remove('active'));
    element.classList.add('active');
    
    // 데이터 새로고침
    renderBooks(category);
}

// 5. 슬라이더 이동 로직
document.getElementById('slide-next').addEventListener('click', () => {
    const totalItems = bookList.children.length;
    if (currentIdx < totalItems - itemsToShow) {
        currentIdx++;
        moveSlider();
    }
});

document.getElementById('slide-prev').addEventListener('click', () => {
    if (currentIdx > 0) {
        currentIdx--;
        moveSlider();
    }
});

function moveSlider() {
    // 카드 너비(200px) + 간격(20px)만큼 이동
    const moveDistance = currentIdx * (200 + 20);
    bookList.style.transform = `translateX(-${moveDistance}px)`;
}
/// 화제의 신작 끝

// 배너 렌더링
function renderBanners(banners) {
    const container = document.getElementById('banner-container');
    if (banners.length > 0) {
        container.innerHTML = `<img src="${banners[0].image}" alt="${banners[0].alt}">`;
    }
}

// 카테고리 렌더링
function renderCategories(categories) {
    const container = document.getElementById('category-container');
    container.innerHTML = categories.map(cat => `
        <div class="category-item">
            <span class="category-icon">${cat.icon}</span>
            <span class="category-name">${cat.name}</span>
        </div>
    `).join('');
}

// 도서 목록 렌더링
function renderBooks(books, containerId) {
    const container = document.getElementById(containerId);
    container.innerHTML = books.map(book => `
        <div class="book-card">
            <img src="${book.image}" alt="${book.title}" onerror="this.src='https://via.placeholder.com/200x280?text=No+Image'">
            <h3>${book.title}</h3>
            <p>${book.author}</p>
            ${book.price ? `<p class="price">${book.price}</p>` : ''}
        </div>
    `).join('');
}

/**
 * [카카오 도서 검색] 데이터 로드 및 출력
 */
function renderKakaoResults() {
    const gridContainer = document.getElementById('kakao-book-grid');

    // 1. 파이썬으로 생성한 JSON 파일 읽기
    fetch('./json/data.json')
        .then(res => res.json())
        .then(data => {
            const books = data.kakaoBooks; // 파이썬에서 저장한 키 이름

            if (!books || books.length === 0) {
                gridContainer.innerHTML = "<p>검색 결과 데이터가 없습니다.</p>";
                return;
            }

            // 2. 데이터를 순회하며 HTML 생성
            gridContainer.innerHTML = books.map(book => `
                <article class="kakao-book-card">
                    <div class="kakao-thumb-box">
                        <img src="${book.thumbnail || 'https://via.placeholder.com/120x174?text=No+Image'}" 
                             alt="${book.title}">
                    </div>
                    <div class="kakao-info">
                        <h3 class="k-title">${book.title}</h3>
                        <p class="k-author">${book.authors.join(', ')}</p>
                        <p class="k-publisher">${book.publisher}</p>
                        <p class="k-price">${book.price.toLocaleString()}원</p>
                    </div>
                </article>
            `).join('');
        })
        .catch(err => {
            console.error("카카오 데이터를 불러오지 못했습니다:", err);
            gridContainer.innerHTML = "<p>JSON 데이터를 불러오는 중 오류가 발생했습니다.</p>";
        });
}

// 페이지 로드 시 실행
document.addEventListener('DOMContentLoaded', () => {
    // 이전 섹션(슬라이더 등) 함수 호출...
    renderKakaoResults();
});
