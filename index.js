//=== index.js ===
// index.js
class BarberConnectApp {
    constructor() {
        this.sentimentPipeline = null;
        this.isWebGPUSupported = false;
        this.testimonials = [
            {
                name: "John Smith",
                role: "Client",
                text: "BarberConnect made it so easy to find a great barber in my area. The booking system is seamless!",
                sentiment: "positive",
                confidence: 0.95
            },
            {
                name: "Mike Johnson",
                role: "Barber",
                text: "This platform has helped me grow my business by 40% in just 3 months. Highly recommended!",
                sentiment: "positive",
                confidence: 0.92
            },
            {
                name: "Sarah Williams",
                role: "Client",
                text: "I love being able to see reviews and portfolios before booking. Takes the guesswork out of finding a good barber.",
                sentiment: "positive",
                confidence: 0.88
            }
        ];
        this.init();
    }

    async init() {
        this.setupEventListeners();
        this.checkWebGPUSupport();
        this.loadTestimonials();
        this.initializeSentimentAnalysis();
    }

    setupEventListeners() {
        // Mobile menu toggle
        const mobileMenuBtn = document.getElementById('mobileMenuBtn');
        const navLinks = document.querySelector('.nav-links');
        
        mobileMenuBtn?.addEventListener('click', () => {
            navLinks.classList.toggle('active');
            mobileMenuBtn.innerHTML = navLinks.classList.contains('active') 
                ? '<i class="fas fa-times"></i>' 
                : '<i class="fas fa-bars"></i>';
        });

        // Smooth scrolling for navigation links
        document.querySelectorAll('a[href^="#"]').forEach(anchor => {
            anchor.addEventListener('click', (e) => {
                e.preventDefault();
                const target = document.querySelector(anchor.getAttribute('href'));
                if (target) {
                    target.scrollIntoView({ behavior: 'smooth', block: 'start' });
                    navLinks.classList.remove('active');
                    mobileMenuBtn.innerHTML = '<i class="fas fa-bars"></i>';
                }
            });
        });

        // Review form submission
        const reviewForm = document.getElementById('reviewForm');
        reviewForm?.addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleReviewSubmission();
        });

        // Device toggle change
        const deviceToggle = document.getElementById('deviceToggle');
        deviceToggle?.addEventListener('change', () => {
            this.initializeSentimentAnalysis();
        });
    }

    async checkWebGPUSupport() {
        if ('gpu' in navigator) {
            try {
                const adapter = await navigator.gpu.requestAdapter();
                this.isWebGPUSupported = !!adapter;
            } catch (error) {
                console.log('WebGPU not available:', error);
            }
        }
    }

    async initializeSentimentAnalysis() {
        const deviceToggle = document.getElementById('deviceToggle');
        const useWebGPU = deviceToggle?.checked && this.isWebGPUSupported;
        
        if (!this.sentimentPipeline) {
            try {
                const device = useWebGPU ? 'webgpu' : 'wasm';
                this.sentimentPipeline = await window.transformers.pipeline(
                    'sentiment-analysis',
                    'Xenova/distilbert-base-uncased-finetuned-sst-2-english',
                    { device }
                );
                console.log(`Sentiment analysis initialized on ${device}`);
            } catch (error) {
                console.error('Failed to initialize sentiment analysis:', error);
                this.sentimentPipeline = null;
            }
        }
    }

    async handleReviewSubmission() {
        const userName = document.getElementById('userName').value;
        const userRole = document.getElementById('userRole').value;
        const reviewText = document.getElementById('reviewText').value;
        const submitBtn = document.querySelector('#reviewForm button[type="submit"]');
        const submitBtnText = document.getElementById('submitBtnText');
        const submitLoader = document.getElementById('submitLoader');
        const sentimentResult = document.getElementById('sentimentResult');

        // Show loading state
        submitBtn.disabled = true;
        submitBtnText.textContent = 'Analyzing...';
        submitLoader.style.display = 'inline-block';

        try {
            // Perform sentiment analysis if pipeline is available
            let sentimentData = { label: 'neutral', score: 0.5 };
            
            if (this.sentimentPipeline) {
                const result = await this.sentimentPipeline(reviewText);
                if (result && result.length > 0) {
                    sentimentData = {
                        label: result[0].label,
                        score: result[0].score
                    };
                }
            }

            // Add new testimonial
            const newTestimonial = {
                name: userName,
                role: userRole,
                text: reviewText,
                sentiment: sentimentData.label.toLowerCase(),
                confidence: (sentimentData.score * 100).toFixed(1)
            };

            this.testimonials.unshift(newTestimonial);
            this.loadTestimonials();

            // Show sentiment analysis result
            if (this.sentimentPipeline) {
                document.getElementById('sentimentLabel').textContent = 
                    sentimentData.label.charAt(0).toUpperCase() + sentimentData.label.slice(1);
                document.getElementById('sentimentLabel').className = 
                    `value ${sentimentData.label.toLowerCase()}`;
                document.getElementById('sentimentConfidence').textContent = 
                    `${newTestimonial.confidence}%`;
                sentimentResult.style.display = 'block';
            }

            // Reset form
            document.getElementById('reviewForm').reset();
            
            // Show success message
            this.showModal('Thank You!', 'Your review has been submitted successfully.');

        } catch (error) {
            console.error('Error submitting review:', error);
            this.showModal('Error', 'Failed to submit review. Please try again.');
        } finally {
            // Reset button state
            submitBtn.disabled = false;
            submitBtnText.textContent = 'Submit Review';
            submitLoader.style.display = 'none';
        }
    }

    loadTestimonials() {
        const testimonialsList = document.getElementById('testimonialsList');
        if (!testimonialsList) return;

        testimonialsList.innerHTML = this.testimonials.map(testimonial => `
            <div class="testimonial-item">
                <div class="testimonial-header">
                    <div class="testimonial-author">
                        <strong>${testimonial.name}</strong>
                        <span class="testimonial-role">${testimonial.role}</span>
                    </div>
                    <div class="testimonial-sentiment ${testimonial.sentiment}">
                        <i class="fas fa-${testimonial.sentiment === 'positive' ? 'smile' : testimonial.sentiment === 'negative' ? 'frown' : 'meh'}"></i>
                        <span>${testimonial.confidence}%</span>
                    </div>
                </div>
                <p class="testimonial-text">${testimonial.text}</p>
            </div>
        `).join('');
    }

    showModal(title, message) {
        const modal = document.getElementById('modal');
        const modalTitle = document.getElementById('modalTitle');
        const modalMessage = document.getElementById('modalMessage');
        
        if (modal && modalTitle && modalMessage) {
            modalTitle.textContent = title;
            modalMessage.textContent = message;
            modal.style.display = 'block';
        }
    }

    selectUserType(type) {
        const titles = {
            barber: 'Welcome, Barber!',
            client: 'Welcome, Client!'
        };
        
        const messages = {
            barber: 'Start managing your appointments and growing your client base today.',
            client: 'Find the perfect barber and book your next appointment with ease.'
        };
        
        this.showModal(titles[type], messages[type]);
    }
}

// Global functions for onclick handlers
function selectUserType(type) {
    window.app.selectUserType(type);
}

function closeModal() {
    const modal = document.getElementById('modal');
    if (modal) {
        modal.style.display = 'none';
    }
}

// Close modal when clicking outside
window.onclick = function(event) {
    const modal = document.getElementById('modal');
    if (event.target === modal) {
        modal.style.display = 'none';
    }
}

// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.app = new BarberConnectApp();
});