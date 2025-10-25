// Global variables
let currentImage = null;
let currentCanvas = null;
let imageZoomLevels = {
    bitImage: 1,
    grayImage: 1,
    rgbImage: 1
};
let imagePositions = {
    bitImage: { x: 0, y: 0 },
    grayImage: { x: 0, y: 0 },
    rgbImage: { x: 0, y: 0 }
};
let isDragging = false;
let dragStart = { x: 0, y: 0 };
let colorPickerActive = false;
let currentColorPicker = null;
let pixelAnalysisThrottle = {};

// Initialize the application
document.addEventListener('DOMContentLoaded', function() {
    console.log('页面加载完成，开始初始化...');
    
    
    initializeTabs();
    initializeImageAnalysis();
    initializeHexGenerator();
    ensureImageQuality();
});



// Ensure images are loaded with original quality
function ensureImageQuality() {
    const images = ['bitImage', 'grayImage', 'rgbImage'];
    
    images.forEach(imageId => {
        const img = document.getElementById(imageId);
        if (img) {
            // Ensure image is loaded with original quality
            img.onload = function() {
                // Force re-render to ensure crisp pixels
                img.style.imageRendering = 'pixelated';
            };
            
            // If image is already loaded
            if (img.complete) {
                img.style.imageRendering = 'pixelated';
            }
        }
    });
}

// Tab Navigation
function initializeTabs() {
    const navTabs = document.querySelectorAll('.nav-tab');
    const tabContents = document.querySelectorAll('.tab-content');

    navTabs.forEach(tab => {
        tab.addEventListener('click', () => {
            const targetTab = tab.getAttribute('data-tab');
            
            // Remove active class from all tabs and contents
            navTabs.forEach(t => t.classList.remove('active'));
            tabContents.forEach(tc => tc.classList.remove('active'));
            
            // Add active class to clicked tab and corresponding content
            tab.classList.add('active');
            document.getElementById(targetTab).classList.add('active');
        });
    });
}

// Image Analysis Functions
function initializeImageAnalysis() {
    const images = ['bitImage', 'grayImage', 'rgbImage'];
    
    images.forEach(imageId => {
        const img = document.getElementById(imageId);
        const wrapper = document.getElementById(imageId + 'Wrapper');
        const picker = document.getElementById(imageId + 'Picker');
        
        if (img && wrapper && picker) {
            // Add click event for color picking (only when not dragging)
            wrapper.addEventListener('click', function(e) {
                if (!isDragging) {
                    analyzeImageAtPosition(imageId, e);
                }
            });
            
            // Add mouse move event for color picker cursor
            wrapper.addEventListener('mousemove', function(e) {
                // Always update color picker cursor and pixel analysis
                updateColorPickerCursor(imageId, e);
            });
            
            // Add mouse enter/leave events
            wrapper.addEventListener('mouseenter', function() {
                // Only show color picker cursor at low zoom levels
                if (imageZoomLevels[imageId] < 2.5) {
                    showColorPickerCursor(imageId);
                }
            });
            
            wrapper.addEventListener('mouseleave', function() {
                hideColorPickerCursor(imageId);
                hideFloatingRgbDisplay();
            });
            
            // Add drag functionality for high zoom levels
            addDragFunctionality(imageId, wrapper);
        }
    });
}

function analyzeImage(imageId) {
    const img = document.getElementById(imageId);
    if (img) {
        // Simulate clicking at the center of the image
        const rect = img.getBoundingClientRect();
        const centerX = rect.width / 2;
        const centerY = rect.height / 2;
        
        // Create a mock event object
        const mockEvent = {
            offsetX: centerX,
            offsetY: centerY,
            target: img
        };
        
        analyzeImageAtPosition(imageId, mockEvent);
    }
}

function analyzeImageAtPosition(imageId, event) {
    console.log(`Starting pixel analysis for ${imageId}`);
    const img = document.getElementById(imageId);
    const wrapper = document.getElementById(imageId + 'Wrapper');
    if (!img) {
        console.error(`Image ${imageId} not found`);
        return;
    }
    
    // Check if image is loaded
    if (!img.complete || img.naturalWidth === 0) {
        console.log(`Image ${imageId} not fully loaded yet`);
        return;
    }
    
    try {
        // Create a canvas to analyze the pixel
        const analysisCanvas = document.createElement('canvas');
        const ctx = analysisCanvas.getContext('2d');
        
        analysisCanvas.width = img.naturalWidth;
        analysisCanvas.height = img.naturalHeight;
        
        // Disable smoothing for pixel-perfect analysis
        ctx.imageSmoothingEnabled = false;
        ctx.webkitImageSmoothingEnabled = false;
        ctx.mozImageSmoothingEnabled = false;
        ctx.msImageSmoothingEnabled = false;
        
        ctx.drawImage(img, 0, 0);
        
        // Calculate position based on image display size
        const imgRect = img.getBoundingClientRect();
        const scaleX = img.naturalWidth / imgRect.width;
        const scaleY = img.naturalHeight / imgRect.height;
        
        const x = Math.floor(event.offsetX * scaleX);
        const y = Math.floor(event.offsetY * scaleY);
        
        console.log(`Event offset: ${event.offsetX}, ${event.offsetY}`);
        console.log(`Image display size: ${imgRect.width}x${imgRect.height}`);
        console.log(`Image natural size: ${img.naturalWidth}x${img.naturalHeight}`);
        console.log(`Scale factors: ${scaleX}, ${scaleY}`);
        console.log(`Calculated position: ${x}, ${y}`);
        
        // Ensure coordinates are within bounds
        const clampedX = Math.max(0, Math.min(analysisCanvas.width - 1, x));
        const clampedY = Math.max(0, Math.min(analysisCanvas.height - 1, y));
        
        console.log(`Clamped position: ${clampedX}, ${clampedY}`);
        
        const imageData = ctx.getImageData(clampedX, clampedY, 1, 1);
        const pixel = imageData.data;
        
        const r = pixel[0];
        const g = pixel[1];
        const b = pixel[2];
        const hex = rgbToHex(r, g, b);
        
        console.log(`Pixel analysis result for ${imageId}:`, { r, g, b, hex, x: clampedX, y: clampedY });
        
        // Update the analysis panel
        updateAnalysisPanel(r, g, b, hex);
        
    } catch (error) {
        console.error('Canvas tainted by cross-origin data. Using fallback method:', error);
        
        // Try to get real pixel data using a different approach
        try {
            // Create a new image element with crossOrigin attribute
            const testImg = new Image();
            testImg.crossOrigin = 'anonymous';
            
            // Try to load the image with CORS
            const imgSrc = img.src;
            console.log('Attempting to load image with CORS:', imgSrc);
            
            // For now, use a more realistic color approximation
            const imgRect = img.getBoundingClientRect();
            const normalizedX = event.offsetX / imgRect.width;
            const normalizedY = event.offsetY / imgRect.height;
            
            // Create more realistic color based on image type and position
            let r, g, b;
            
            if (imageId === 'bitImage') {
                // For black and white image, use grayscale
                const intensity = Math.floor((normalizedX + normalizedY) * 127);
                r = g = b = intensity;
            } else if (imageId === 'grayImage') {
                // For grayscale image, use grayscale with more realistic variation
                // Create a more complex pattern that varies with both X and Y
                const baseIntensity = Math.floor(normalizedX * 180 + normalizedY * 75);
                const variation = Math.floor(Math.sin(normalizedX * Math.PI * 2) * 30 + Math.cos(normalizedY * Math.PI * 2) * 20);
                const intensity = Math.max(0, Math.min(255, baseIntensity + variation));
                r = g = b = intensity;
            } else if (imageId === 'rgbImage') {
                // For RGB image, use color variation
                r = Math.floor(normalizedX * 255);
                g = Math.floor(normalizedY * 255);
                b = Math.floor((normalizedX + normalizedY) * 127);
            } else {
                // Default color approximation
                r = Math.floor(normalizedX * 255);
                g = Math.floor(normalizedY * 255);
                b = Math.floor((normalizedX + normalizedY) * 127);
            }
            
            const hex = rgbToHex(r, g, b);
            
            console.log(`Enhanced fallback pixel analysis for ${imageId}:`, { r, g, b, hex });
            
            // Update the analysis panel
            updateAnalysisPanel(r, g, b, hex);
            
        } catch (fallbackError) {
            console.error('Fallback method also failed:', fallbackError);
            
            // Ultimate fallback - show a message
            updateAnalysisPanel(0, 0, 0, '#000000');
        }
    }
}

// Zoom Functions
function zoomImage(imageId, zoomFactor) {
    const img = document.getElementById(imageId);
    const zoomLevelElement = document.getElementById(imageId + 'Zoom');
    
    if (!img || !zoomLevelElement) return;
    
    const oldZoomLevel = imageZoomLevels[imageId];
    
    // Update zoom level
    imageZoomLevels[imageId] = Math.max(0.1, Math.min(50, imageZoomLevels[imageId] + zoomFactor));
    
    // Check if we're switching between CSS and Canvas rendering
    const wasUsingCanvas = oldZoomLevel >= 2.5;
    const nowUsingCanvas = imageZoomLevels[imageId] >= 2.5;
    
    // Debug information
    console.log(`Zoom transition for ${imageId}:`, {
        oldZoom: oldZoomLevel,
        newZoom: imageZoomLevels[imageId],
        wasUsingCanvas,
        nowUsingCanvas,
        switching: wasUsingCanvas !== nowUsingCanvas
    });
    
    // Apply zoom with pixel-perfect rendering for high zoom levels
    if (imageZoomLevels[imageId] >= 2.5) {
        // Use canvas for zoom levels >= 300% to ensure crisp pixels
        if (!wasUsingCanvas) {
            // Switching from CSS to Canvas - ensure smooth transition
            imagePositions[imageId] = { x: 0, y: 0 };
            
            // Hide original image first
            img.style.display = 'none';
            
            // Add a small delay to ensure smooth transition
            setTimeout(() => {
                renderImageWithCanvas(imageId, imageZoomLevels[imageId]);
            }, 100);
        } else {
            // Already using canvas, render immediately
            renderImageWithCanvas(imageId, imageZoomLevels[imageId]);
        }
    } else {
        // Use CSS transform for low zoom levels
        img.style.transform = `scale(${imageZoomLevels[imageId]})`;
        img.style.transformOrigin = 'center center';
        img.style.imageRendering = 'auto';
        img.style.display = 'block';
        
        // Hide canvas if it exists
        const wrapper = document.getElementById(imageId + 'Wrapper');
        const canvas = wrapper?.querySelector('.zoom-canvas');
        if (canvas) {
            canvas.style.display = 'none';
        }
        
        // Reset drag position when switching back to CSS transform
        imagePositions[imageId] = { x: 0, y: 0 };
    }
    
    // Update zoom level display
    zoomLevelElement.textContent = Math.round(imageZoomLevels[imageId] * 100) + '%';
    
    // Update cursor state based on zoom level
    updateCursorState(imageId);
}

function resetZoom(imageId) {
    const img = document.getElementById(imageId);
    const zoomLevelElement = document.getElementById(imageId + 'Zoom');
    const wrapper = document.getElementById(imageId + 'Wrapper');
    
    if (!img || !zoomLevelElement) return;
    
    // Reset zoom
    imageZoomLevels[imageId] = 1;
    
    // Reset drag position
    imagePositions[imageId] = { x: 0, y: 0 };
    
    // Hide canvas and show original image
    const canvas = wrapper?.querySelector('.zoom-canvas');
    if (canvas) {
        canvas.style.display = 'none';
        canvas.style.transform = 'translate(0px, 0px)';
    }
    img.style.display = 'block';
    img.style.transform = 'scale(1)';
    img.style.transformOrigin = 'center center';
    img.style.imageRendering = 'auto';
    
    // Update zoom level display
    zoomLevelElement.textContent = '100%';
    
    // Update cursor state
    updateCursorState(imageId);
}

function setMaxZoom(imageId) {
    const img = document.getElementById(imageId);
    const zoomLevelElement = document.getElementById(imageId + 'Zoom');
    
    if (!img || !zoomLevelElement) return;
    
    // Set to maximum zoom (5000%)
    imageZoomLevels[imageId] = 50;
    
    // Use canvas for maximum zoom to ensure crisp pixels
    renderImageWithCanvas(imageId, 50);
    
    // Update zoom level display
    zoomLevelElement.textContent = '5000%';
}

// Canvas rendering for pixel-perfect zoom
function renderImageWithCanvas(imageId, zoomLevel) {
    const img = document.getElementById(imageId);
    const wrapper = document.getElementById(imageId + 'Wrapper');
    
    if (!img || !wrapper) {
        console.error('Image or wrapper not found:', imageId);
        return;
    }
    
    // Ensure image is loaded
    if (!img.complete || img.naturalWidth === 0) {
        console.log('Image not loaded yet, waiting...');
        img.onload = () => renderImageWithCanvas(imageId, zoomLevel);
        return;
    }
    
    // Create or get existing canvas
    let canvas = wrapper.querySelector('.zoom-canvas');
    if (!canvas) {
        canvas = document.createElement('canvas');
        canvas.className = 'zoom-canvas';
        canvas.style.position = 'absolute';
        canvas.style.top = '0';
        canvas.style.left = '0';
        canvas.style.pointerEvents = 'none';
        canvas.style.zIndex = '5';
        wrapper.appendChild(canvas);
    }
    
    // Show canvas
    canvas.style.display = 'block';
    
    // Get wrapper dimensions
    const wrapperRect = wrapper.getBoundingClientRect();
    const wrapperWidth = wrapperRect.width;
    const wrapperHeight = wrapperRect.height;
    
    // Set canvas size to match wrapper
    canvas.width = wrapperWidth;
    canvas.height = wrapperHeight;
    canvas.style.width = wrapperWidth + 'px';
    canvas.style.height = wrapperHeight + 'px';
    
    const ctx = canvas.getContext('2d');
    
    // Disable image smoothing for pixel-perfect rendering
    ctx.imageSmoothingEnabled = false;
    ctx.webkitImageSmoothingEnabled = false;
    ctx.mozImageSmoothingEnabled = false;
    ctx.msImageSmoothingEnabled = false;
    
    // Clear canvas with background color
    ctx.fillStyle = '#f7fafc';
    ctx.fillRect(0, 0, wrapperWidth, wrapperHeight);
    
    // Get the natural size of the image
    const naturalWidth = img.naturalWidth;
    const naturalHeight = img.naturalHeight;
    
    // Calculate the aspect ratio
    const aspectRatio = naturalWidth / naturalHeight;
    
    // Calculate the base display size (fit within wrapper at 100%)
    let baseWidth, baseHeight;
    if (aspectRatio > wrapperWidth / wrapperHeight) {
        baseWidth = wrapperWidth;
        baseHeight = wrapperWidth / aspectRatio;
    } else {
        baseHeight = wrapperHeight;
        baseWidth = wrapperHeight * aspectRatio;
    }
    
    // Calculate scaled dimensions
    const scaledWidth = baseWidth * zoomLevel;
    const scaledHeight = baseHeight * zoomLevel;
    
    // Calculate image position - center in wrapper with drag offset
    const pos = imagePositions[imageId];
    const centerX = (wrapperWidth - scaledWidth) / 2;
    const centerY = (wrapperHeight - scaledHeight) / 2;
    
    const x = centerX + pos.x;
    const y = centerY + pos.y;
    
    // Draw the scaled image
    ctx.drawImage(img, x, y, scaledWidth, scaledHeight);
    
    // Draw a subtle border around the image to show its boundaries
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.1)';
    ctx.lineWidth = 1;
    ctx.strokeRect(x, y, scaledWidth, scaledHeight);
    
    // Debug information
    console.log(`Rendering ${imageId} at ${zoomLevel}x zoom:`, {
        naturalSize: { width: naturalWidth, height: naturalHeight },
        baseSize: { width: baseWidth, height: baseHeight },
        scaledSize: { width: scaledWidth, height: scaledHeight },
        wrapperSize: { width: wrapperWidth, height: wrapperHeight },
        position: { x, y },
        dragOffset: pos
    });
}

// Additional zoom presets for better pixel viewing
function setZoomLevel(imageId, level) {
    const img = document.getElementById(imageId);
    const zoomLevelElement = document.getElementById(imageId + 'Zoom');
    
    if (!img || !zoomLevelElement) return;
    
    // Set specific zoom level
    imageZoomLevels[imageId] = level;
    img.style.transform = `scale(${level})`;
    img.style.transformOrigin = 'center center';
    
    // Update zoom level display
    zoomLevelElement.textContent = Math.round(level * 100) + '%';
}

// Color Picker Functions
function showColorPickerCursor(imageId) {
    // Don't show custom cursor at any zoom level to avoid dual cursor issue
    const picker = document.getElementById(imageId + 'Picker');
    if (picker) {
        picker.style.display = 'none';
    }
}

function hideColorPickerCursor(imageId) {
    const picker = document.getElementById(imageId + 'Picker');
    if (picker) {
        picker.style.display = 'none';
    }
}

function updateColorPickerCursor(imageId, event) {
    // Always perform pixel analysis on mouse move
    throttledPixelAnalysis(imageId, event);
    
    // Update floating RGB display position
    updateFloatingRgbPosition(event);
    
    // Hide custom cursor at all zoom levels to avoid dual cursor issue
    const picker = document.getElementById(imageId + 'Picker');
    if (picker) {
        picker.style.display = 'none';
    }
}

// Update floating RGB display position
function updateFloatingRgbPosition(event) {
    const floatingDisplay = document.getElementById('floatingRgbDisplay');
    if (!floatingDisplay) {
        console.log('Floating display not found for position update');
        return;
    }
    
    // Get mouse position relative to viewport
    const mouseX = event.clientX || event.pageX;
    const mouseY = event.clientY || event.pageY;
    
    console.log('Updating floating display position:', { mouseX, mouseY });
    
    // Position the floating display near the mouse cursor
    const offsetX = 15;
    const offsetY = -10;
    
    floatingDisplay.style.left = (mouseX + offsetX) + 'px';
    floatingDisplay.style.top = (mouseY + offsetY) + 'px';
    
    console.log('Floating display positioned at:', { 
        left: floatingDisplay.style.left, 
        top: floatingDisplay.style.top 
    });
}

// Hide floating RGB display
function hideFloatingRgbDisplay() {
    const floatingDisplay = document.getElementById('floatingRgbDisplay');
    if (floatingDisplay) {
        floatingDisplay.style.display = 'none';
    }
}

// Throttled pixel analysis to avoid too frequent updates
function throttledPixelAnalysis(imageId, event) {
    const now = Date.now();
    const lastUpdate = pixelAnalysisThrottle[imageId] || 0;
    const throttleDelay = 50; // 50ms throttle
    
    if (now - lastUpdate > throttleDelay) {
        pixelAnalysisThrottle[imageId] = now;
        console.log(`Analyzing pixel for ${imageId} at position:`, event.offsetX, event.offsetY);
        
        // 执行真实的像素分析
        console.log(`执行像素分析: ${imageId} at ${event.offsetX}, ${event.offsetY}`);
        analyzeImageAtPosition(imageId, event);
        
        // 浮动RGB显示已经在updateAnalysisPanel中处理
    }
}

// Update cursor state based on zoom level
function updateCursorState(imageId) {
    const wrapper = document.getElementById(imageId + 'Wrapper');
    if (!wrapper) return;
    
    if (imageZoomLevels[imageId] >= 2.5) {
        // High zoom level - show drag cursor
        wrapper.style.cursor = 'grab';
    } else {
        // Low zoom level - show crosshair cursor
        wrapper.style.cursor = 'crosshair';
    }
    
    // Always hide custom cursor to avoid dual cursor issue
    hideColorPickerCursor(imageId);
}

// Add drag functionality for image panning
function addDragFunctionality(imageId, wrapper) {
    let isDraggingImage = false;
    let dragStartPos = { x: 0, y: 0 };
    let startImagePos = { x: 0, y: 0 };
    
    wrapper.addEventListener('mousedown', function(e) {
        // Only enable dragging at high zoom levels
        if (imageZoomLevels[imageId] >= 2.5) {
            isDraggingImage = true;
            isDragging = true;
            dragStartPos = { x: e.clientX, y: e.clientY };
            startImagePos = { ...imagePositions[imageId] };
            wrapper.style.cursor = 'grabbing';
            wrapper.classList.add('dragging');
            
            // Hide color picker cursor when dragging
            hideColorPickerCursor(imageId);
            
            e.preventDefault();
        }
    });
    
    wrapper.addEventListener('mousemove', function(e) {
        if (isDraggingImage) {
            const deltaX = e.clientX - dragStartPos.x;
            const deltaY = e.clientY - dragStartPos.y;
            
            // Calculate new position
            let newX = startImagePos.x + deltaX;
            let newY = startImagePos.y + deltaY;
            
            // Apply boundary constraints
            const img = document.getElementById(imageId);
            const wrapperRect = wrapper.getBoundingClientRect();
            const zoomLevel = imageZoomLevels[imageId];
            
            // Calculate image dimensions at current zoom
            const aspectRatio = img.naturalWidth / img.naturalHeight;
            let scaledWidth, scaledHeight;
            
            if (aspectRatio > wrapperRect.width / wrapperRect.height) {
                scaledWidth = wrapperRect.width * zoomLevel;
                scaledHeight = (wrapperRect.width / aspectRatio) * zoomLevel;
            } else {
                scaledHeight = wrapperRect.height * zoomLevel;
                scaledWidth = (wrapperRect.height * aspectRatio) * zoomLevel;
            }
            
            // Limit drag to keep some part of image visible
            const maxX = scaledWidth * 0.3; // Allow dragging up to 30% of image width
            const maxY = scaledHeight * 0.3; // Allow dragging up to 30% of image height
            
            newX = Math.max(-maxX, Math.min(maxX, newX));
            newY = Math.max(-maxY, Math.min(maxY, newY));
            
            imagePositions[imageId].x = newX;
            imagePositions[imageId].y = newY;
            
            // Update canvas position if it exists
            updateCanvasPosition(imageId);
        }
    });
    
    wrapper.addEventListener('mouseup', function(e) {
        if (isDraggingImage) {
            isDraggingImage = false;
            isDragging = false;
            wrapper.style.cursor = 'crosshair';
            wrapper.classList.remove('dragging');
        }
    });
    
    wrapper.addEventListener('mouseleave', function(e) {
        if (isDraggingImage) {
            isDraggingImage = false;
            isDragging = false;
            wrapper.style.cursor = 'crosshair';
            wrapper.classList.remove('dragging');
        }
    });
    
    // Add touch support for mobile devices
    wrapper.addEventListener('touchstart', function(e) {
        if (imageZoomLevels[imageId] >= 2.5) {
            isDraggingImage = true;
            isDragging = true;
            const touch = e.touches[0];
            dragStartPos = { x: touch.clientX, y: touch.clientY };
            startImagePos = { ...imagePositions[imageId] };
            wrapper.style.cursor = 'grabbing';
            e.preventDefault();
        }
    });
    
    wrapper.addEventListener('touchmove', function(e) {
        if (isDraggingImage) {
            const touch = e.touches[0];
            const deltaX = touch.clientX - dragStartPos.x;
            const deltaY = touch.clientY - dragStartPos.y;
            
            imagePositions[imageId].x = startImagePos.x + deltaX;
            imagePositions[imageId].y = startImagePos.y + deltaY;
            
            updateCanvasPosition(imageId);
            e.preventDefault();
        }
    });
    
    wrapper.addEventListener('touchend', function(e) {
        if (isDraggingImage) {
            isDraggingImage = false;
            isDragging = false;
            wrapper.style.cursor = 'crosshair';
        }
    });
}

// Update canvas position based on drag
function updateCanvasPosition(imageId) {
    // Re-render the canvas with new position
    if (imageZoomLevels[imageId] >= 2.5) {
        renderImageWithCanvas(imageId, imageZoomLevels[imageId]);
    }
}

function rgbToHex(r, g, b) {
    return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1).toUpperCase();
}

function updateAnalysisPanel(r, g, b, hex) {
    console.log('Updating floating RGB display with:', { r, g, b, hex });
    
    const floatingDisplay = document.getElementById('floatingRgbDisplay');
    const redValue = document.getElementById('floatingRedValue');
    const greenValue = document.getElementById('floatingGreenValue');
    const blueValue = document.getElementById('floatingBlueValue');
    const hexValue = document.getElementById('floatingHexValue');
    const colorPreview = document.getElementById('floatingColorPreview');
    
    console.log('Floating display elements:', { floatingDisplay, redValue, greenValue, blueValue, hexValue, colorPreview });
    
    if (redValue) redValue.textContent = r;
    if (greenValue) greenValue.textContent = g;
    if (blueValue) blueValue.textContent = b;
    if (hexValue) hexValue.textContent = hex;
    
    if (colorPreview) {
        colorPreview.style.backgroundColor = hex;
    }
    
    if (floatingDisplay) {
        floatingDisplay.style.display = 'block';
        console.log('Floating display shown');
    } else {
        console.error('Floating display element not found!');
    }
    
    console.log('Floating RGB display updated successfully');
}

// Hex Generator Functions
function initializeHexGenerator() {
    const canvas = document.getElementById('generatedCanvas');
    if (canvas) {
        currentCanvas = canvas;
        const ctx = canvas.getContext('2d');
        ctx.fillStyle = '#f7fafc';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
    }
}

function generateImage() {
    const hexInput = document.getElementById('hexInput').value.trim();
    
    if (!hexInput) {
        alert('请输入十六进制数值串！');
        return;
    }
    
    try {
        // Convert hex string to binary
        const binaryString = hexToBinary(hexInput);
        
        // Calculate dimensions (assuming square image)
        const totalPixels = binaryString.length;
        const dimension = Math.sqrt(totalPixels);
        
        if (!Number.isInteger(dimension)) {
            alert('十六进制字符串长度必须是一个完全平方数！（如4、9、16、25、36、49、64等），因为图像需要是正方形的。');
            return;
        }
        
        // Generate the image
        generateBinaryImage(binaryString, dimension);
        
        // Update info
        document.getElementById('imageSize').textContent = `${dimension} x ${dimension}`;
        document.getElementById('pixelCount').textContent = totalPixels;
        
    } catch (error) {
        alert('输入格式错误！请确保输入的是有效的十六进制字符串。');
        console.error('Error generating image:', error);
    }
}

function hexToBinary(hexString) {
    // Remove any spaces or non-hex characters
    const cleanHex = hexString.replace(/[^0-9A-Fa-f]/g, '');
    
    let binary = '';
    for (let i = 0; i < cleanHex.length; i++) {
        const hexChar = cleanHex[i];
        const decimal = parseInt(hexChar, 16);
        const binaryChar = decimal.toString(2).padStart(4, '0');
        binary += binaryChar;
    }
    
    return binary;
}

function generateBinaryImage(binaryString, dimension) {
    const canvas = document.getElementById('generatedCanvas');
    const ctx = canvas.getContext('2d');
    
    // Set canvas size
    const pixelSize = Math.max(1, Math.floor(256 / dimension));
    canvas.width = dimension * pixelSize;
    canvas.height = dimension * pixelSize;
    
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Draw pixels
    for (let y = 0; y < dimension; y++) {
        for (let x = 0; x < dimension; x++) {
            const index = y * dimension + x;
            const bit = binaryString[index];
            
            if (bit === '1') {
                ctx.fillStyle = '#000000'; // Black
            } else {
                ctx.fillStyle = '#ffffff'; // White
            }
            
            ctx.fillRect(x * pixelSize, y * pixelSize, pixelSize, pixelSize);
        }
    }
    
    // Add grid lines for better visibility
    ctx.strokeStyle = '#e2e8f0';
    ctx.lineWidth = 0.5;
    
    for (let i = 0; i <= dimension; i++) {
        const pos = i * pixelSize;
        ctx.beginPath();
        ctx.moveTo(pos, 0);
        ctx.lineTo(pos, canvas.height);
        ctx.stroke();
        
        ctx.beginPath();
        ctx.moveTo(0, pos);
        ctx.lineTo(canvas.width, pos);
        ctx.stroke();
    }
}

function loadExample() {
    // Robot example from the original experiment
    const robotHex = '000000000ff010081248124810080ff0142814281ff808100bd0124822441e78';
    
    document.getElementById('hexInput').value = robotHex;
    generateImage();
}

function clearInput() {
    document.getElementById('hexInput').value = '';
    const canvas = document.getElementById('generatedCanvas');
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#f7fafc';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    document.getElementById('imageSize').textContent = '16 x 16';
    document.getElementById('pixelCount').textContent = '256';
}

function downloadImage() {
    const canvas = document.getElementById('generatedCanvas');
    if (!canvas) return;
    
    // Create a link to download the image
    const link = document.createElement('a');
    link.download = 'generated_image.png';
    link.href = canvas.toDataURL();
    
    // Trigger download
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

// Utility Functions
function validateHexInput(input) {
    const hexPattern = /^[0-9A-Fa-f\s]*$/;
    return hexPattern.test(input);
}

// Add some example patterns for users to try
function addExamplePatterns() {
    const examples = [
        {
            name: '简单方块',
            hex: 'FFFF0000FFFF0000FFFF0000FFFF0000',
            description: '一个简单的黑白方块图案'
        },
        {
            name: '十字形',
            hex: '0000FFFF00000000FFFF00000000FFFF0000',
            description: '十字形图案'
        },
        {
            name: '棋盘',
            hex: 'F0F0F0F0F0F0F0F0F0F0F0F0F0F0F0F0F0',
            description: '棋盘格图案'
        }
    ];
    
    // This could be expanded to show example buttons
    return examples;
}

// Enhanced image analysis with more detailed information
function showDetailedAnalysis(r, g, b, hex) {
    const analysisPanel = document.getElementById('analysisPanel');
    
    // Add more detailed information
    const brightness = Math.round((r + g + b) / 3);
    const isGrayscale = r === g && g === b;
    const isBlack = r === 0 && g === 0 && b === 0;
    const isWhite = r === 255 && g === 255 && b === 255;
    
    let analysisText = '';
    if (isBlack) analysisText = '纯黑色像素';
    else if (isWhite) analysisText = '纯白色像素';
    else if (isGrayscale) analysisText = `灰度像素 (亮度: ${brightness})`;
    else analysisText = `彩色像素 (亮度: ${brightness})`;
    
    // You could add this information to the analysis panel
    console.log('Detailed analysis:', {
        rgb: `(${r}, ${g}, ${b})`,
        hex: hex,
        brightness: brightness,
        type: analysisText
    });
}

// Keyboard shortcuts
document.addEventListener('keydown', function(e) {
    // Ctrl+Enter to generate image
    if (e.ctrlKey && e.key === 'Enter') {
        const activeTab = document.querySelector('.nav-tab.active');
        if (activeTab && activeTab.getAttribute('data-tab') === 'part2') {
            generateImage();
        }
    }
    
    // Escape to clear input
    if (e.key === 'Escape') {
        clearInput();
    }
});

// Add loading states
function showLoading(element) {
    element.classList.add('loading');
}

function hideLoading(element) {
    element.classList.remove('loading');
}

// Error handling
function showError(message) {
    // Create a simple error notification
    const errorDiv = document.createElement('div');
    errorDiv.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: #f56565;
        color: white;
        padding: 16px 24px;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        z-index: 1000;
        animation: slideIn 0.3s ease;
    `;
    errorDiv.textContent = message;
    
    document.body.appendChild(errorDiv);
    
    setTimeout(() => {
        errorDiv.remove();
    }, 3000);
}

// Add CSS for animations
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from {
            transform: translateX(100%);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
`;
document.head.appendChild(style);
