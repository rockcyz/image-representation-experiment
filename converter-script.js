// 数值转换工具 JavaScript 功能
document.addEventListener('DOMContentLoaded', function() {
    console.log('数值转换工具初始化...');
    
    // 获取所有元素
    const navTabs = document.querySelectorAll('.nav-tab');
    const tabContents = document.querySelectorAll('.tab-content');
    
    // 转换器元素
    const decimalInput = document.getElementById('decimalInput');
    const binaryInput = document.getElementById('binaryInput');
    const hexInput = document.getElementById('hexInput');
    const convertBtn = document.getElementById('convertBtn');
    const clearConverterBtn = document.getElementById('clearConverterBtn');
    
    // 算术运算元素
    const arithmeticBase = document.getElementById('arithmeticBase');
    const firstNumber = document.getElementById('firstNumber');
    const operator = document.getElementById('operator');
    const secondNumber = document.getElementById('secondNumber');
    const calculateBtn = document.getElementById('calculateBtn');
    const clearArithmeticBtn = document.getElementById('clearArithmeticBtn');
    
    // 逻辑运算元素
    const firstBinary = document.getElementById('firstBinary');
    const logicalOperator = document.getElementById('logicalOperator');
    const secondBinary = document.getElementById('secondBinary');
    const secondBinaryGroup = document.getElementById('secondBinaryGroup');
    const logicalCalculateBtn = document.getElementById('logicalCalculateBtn');
    const clearLogicalBtn = document.getElementById('clearLogicalBtn');
    
    // 结果元素
    const resultDecimal = document.getElementById('resultDecimal');
    const resultBinary = document.getElementById('resultBinary');
    const resultHex = document.getElementById('resultHex');
    
    // 算术结果元素
    const resultDecimalArithmetic = document.getElementById('resultDecimalArithmetic');
    const resultBinaryArithmetic = document.getElementById('resultBinaryArithmetic');
    const resultHexArithmetic = document.getElementById('resultHexArithmetic');
    
    // 逻辑结果元素
    const resultBinaryLogical = document.getElementById('resultBinaryLogical');
    const resultDecimalLogical = document.getElementById('resultDecimalLogical');
    const resultHexLogical = document.getElementById('resultHexLogical');
    
    // 初始化
    init();
    
    function init() {
        console.log('开始初始化数值转换工具...');
        
        // 设置标签页切换
        setupTabSwitching();
        
        // 设置转换器功能
        setupConverter();
        
        // 设置算术运算功能
        setupArithmetic();
        
        // 设置逻辑运算功能
        setupLogical();
        
        console.log('数值转换工具初始化完成');
    }
    
    // 标签页切换功能
    function setupTabSwitching() {
        navTabs.forEach(tab => {
            tab.addEventListener('click', function() {
                const targetTab = this.getAttribute('data-tab');
                
                // 移除所有活动状态
                navTabs.forEach(t => t.classList.remove('active'));
                tabContents.forEach(tc => tc.classList.remove('active'));
                
                // 添加活动状态
                this.classList.add('active');
                document.getElementById(targetTab).classList.add('active');
                
                console.log(`切换到标签页: ${targetTab}`);
            });
        });
    }
    
    // 转换器功能
    function setupConverter() {
        // 转换按钮
        convertBtn.addEventListener('click', performConversion);
        
        // 清空按钮
        clearConverterBtn.addEventListener('click', clearConverter);
        
        // 输入框变化时自动转换
        [decimalInput, binaryInput, hexInput].forEach(input => {
            input.addEventListener('input', debounce(performConversion, 300));
        });
    }
    
    // 算术运算功能
    function setupArithmetic() {
        // 计算按钮
        calculateBtn.addEventListener('click', performArithmetic);
        
        // 清空按钮
        clearArithmeticBtn.addEventListener('click', clearArithmetic);
        
        // 进制变化时更新输入提示
        arithmeticBase.addEventListener('change', updateArithmeticPlaceholders);
    }
    
    // 逻辑运算功能
    function setupLogical() {
        // 计算按钮
        logicalCalculateBtn.addEventListener('click', performLogical);
        
        // 清空按钮
        clearLogicalBtn.addEventListener('click', clearLogical);
        
        // 逻辑运算符变化时处理第二个输入框
        logicalOperator.addEventListener('change', handleLogicalOperatorChange);
        
        // 初始化时处理
        handleLogicalOperatorChange();
    }
    
    // 进制转换功能
    function performConversion() {
        console.log('执行进制转换...');
        
        let decimalValue = null;
        let binaryValue = null;
        let hexValue = null;
        
        // 检查哪个输入框有值
        if (decimalInput.value.trim()) {
            try {
                decimalValue = parseInt(decimalInput.value.trim(), 10);
                if (isNaN(decimalValue)) throw new Error('无效的十进制数字');
                
                binaryValue = decimalValue.toString(2);
                hexValue = decimalValue.toString(16).toUpperCase();
                
                console.log(`从十进制转换: ${decimalValue} -> 二进制: ${binaryValue}, 十六进制: ${hexValue}`);
            } catch (error) {
                showError('无效的十进制数字');
                return;
            }
        } else if (binaryInput.value.trim()) {
            try {
                // 验证二进制格式
                if (!/^[01]+$/.test(binaryInput.value.trim())) {
                    throw new Error('无效的二进制数字');
                }
                
                decimalValue = parseInt(binaryInput.value.trim(), 2);
                binaryValue = binaryInput.value.trim();
                hexValue = decimalValue.toString(16).toUpperCase();
                
                console.log(`从二进制转换: ${binaryValue} -> 十进制: ${decimalValue}, 十六进制: ${hexValue}`);
            } catch (error) {
                showError('无效的二进制数字');
                return;
            }
        } else if (hexInput.value.trim()) {
            try {
                // 验证十六进制格式
                if (!/^[0-9A-Fa-f]+$/.test(hexInput.value.trim())) {
                    throw new Error('无效的十六进制数字');
                }
                
                decimalValue = parseInt(hexInput.value.trim(), 16);
                binaryValue = decimalValue.toString(2);
                hexValue = hexInput.value.trim().toUpperCase();
                
                console.log(`从十六进制转换: ${hexValue} -> 十进制: ${decimalValue}, 二进制: ${binaryValue}`);
            } catch (error) {
                showError('无效的十六进制数字');
                return;
            }
        } else {
            clearResults();
            return;
        }
        
        // 更新结果显示
        updateConversionResults(decimalValue, binaryValue, hexValue);
    }
    
    // 更新转换结果
    function updateConversionResults(decimal, binary, hex) {
        resultDecimal.textContent = decimal;
        resultBinary.textContent = binary;
        resultHex.textContent = hex;
        
        // 添加动画效果
        [resultDecimal, resultBinary, resultHex].forEach(element => {
            element.style.transform = 'scale(1.1)';
            setTimeout(() => {
                element.style.transform = 'scale(1)';
            }, 200);
        });
    }
    
    // 清空转换器
    function clearConverter() {
        decimalInput.value = '';
        binaryInput.value = '';
        hexInput.value = '';
        clearResults();
        console.log('转换器已清空');
    }
    
    // 清空结果显示
    function clearResults() {
        resultDecimal.textContent = '-';
        resultBinary.textContent = '-';
        resultHex.textContent = '-';
    }
    
    // 算术运算功能
    function performArithmetic() {
        console.log('执行算术运算...');
        
        const base = parseInt(arithmeticBase.value);
        const num1 = firstNumber.value.trim();
        const op = operator.value;
        const num2 = secondNumber.value.trim();
        
        if (!num1 || !num2) {
            showError('请输入两个数字');
            return;
        }
        
        try {
            // 转换为十进制进行计算
            const decimal1 = parseInt(num1, base);
            const decimal2 = parseInt(num2, base);
            
            if (isNaN(decimal1) || isNaN(decimal2)) {
                throw new Error('无效的数字格式');
            }
            
            let result;
            switch (op) {
                case '+':
                    result = decimal1 + decimal2;
                    break;
                case '-':
                    result = decimal1 - decimal2;
                    break;
                case '*':
                    result = decimal1 * decimal2;
                    break;
                case '/':
                    if (decimal2 === 0) {
                        throw new Error('除数不能为零');
                    }
                    result = Math.floor(decimal1 / decimal2);
                    break;
                default:
                    throw new Error('无效的运算符');
            }
            
            console.log(`算术运算: ${decimal1} ${op} ${decimal2} = ${result}`);
            
            // 更新结果显示
            updateArithmeticResults(result);
            
        } catch (error) {
            showError(error.message);
        }
    }
    
    // 更新算术结果
    function updateArithmeticResults(result) {
        resultDecimalArithmetic.textContent = result;
        resultBinaryArithmetic.textContent = result.toString(2);
        resultHexArithmetic.textContent = result.toString(16).toUpperCase();
        
        // 添加动画效果
        [resultDecimalArithmetic, resultBinaryArithmetic, resultHexArithmetic].forEach(element => {
            element.style.transform = 'scale(1.1)';
            setTimeout(() => {
                element.style.transform = 'scale(1)';
            }, 200);
        });
    }
    
    // 清空算术运算
    function clearArithmetic() {
        firstNumber.value = '';
        secondNumber.value = '';
        resultDecimalArithmetic.textContent = '-';
        resultBinaryArithmetic.textContent = '-';
        resultHexArithmetic.textContent = '-';
        console.log('算术运算已清空');
    }
    
    // 更新算术运算占位符
    function updateArithmeticPlaceholders() {
        const base = arithmeticBase.value;
        const placeholder = base === '2' ? '输入二进制数字' : 
                          base === '16' ? '输入十六进制数字' : '输入十进制数字';
        
        firstNumber.placeholder = placeholder;
        secondNumber.placeholder = placeholder;
    }
    
    // 逻辑运算功能
    function performLogical() {
        console.log('执行逻辑运算...');
        
        const op = logicalOperator.value;
        const num1 = firstBinary.value.trim();
        const num2 = secondBinary.value.trim();
        
        if (!num1) {
            showError('请输入第一个二进制数');
            return;
        }
        
        if (op !== 'NOT' && !num2) {
            showError('请输入第二个二进制数');
            return;
        }
        
        try {
            // 验证二进制格式
            if (!/^[01]+$/.test(num1)) {
                throw new Error('第一个数字不是有效的二进制格式');
            }
            
            if (op !== 'NOT' && !/^[01]+$/.test(num2)) {
                throw new Error('第二个数字不是有效的二进制格式');
            }
            
            let result;
            if (op === 'NOT') {
                result = performNotOperation(num1);
            } else {
                result = performBinaryOperation(num1, num2, op);
            }
            
            console.log(`逻辑运算: ${num1} ${op} ${op !== 'NOT' ? num2 : ''} = ${result}`);
            
            // 更新结果显示
            updateLogicalResults(result);
            
        } catch (error) {
            showError(error.message);
        }
    }
    
    // 执行NOT运算
    function performNotOperation(binary) {
        return binary.split('').map(bit => bit === '0' ? '1' : '0').join('');
    }
    
    // 执行二进制运算
    function performBinaryOperation(num1, num2, op) {
        // 确保两个数字长度相同
        const maxLength = Math.max(num1.length, num2.length);
        num1 = num1.padStart(maxLength, '0');
        num2 = num2.padStart(maxLength, '0');
        
        let result = '';
        for (let i = 0; i < maxLength; i++) {
            const bit1 = parseInt(num1[i]);
            const bit2 = parseInt(num2[i]);
            let resultBit;
            
            switch (op) {
                case 'AND':
                    resultBit = bit1 & bit2;
                    break;
                case 'OR':
                    resultBit = bit1 | bit2;
                    break;
                case 'XOR':
                    resultBit = bit1 ^ bit2;
                    break;
                default:
                    throw new Error('无效的逻辑运算符');
            }
            
            result += resultBit.toString();
        }
        
        return result;
    }
    
    // 更新逻辑结果
    function updateLogicalResults(binaryResult) {
        const decimalResult = parseInt(binaryResult, 2);
        
        resultBinaryLogical.textContent = binaryResult;
        resultDecimalLogical.textContent = decimalResult;
        resultHexLogical.textContent = decimalResult.toString(16).toUpperCase();
        
        // 添加动画效果
        [resultBinaryLogical, resultDecimalLogical, resultHexLogical].forEach(element => {
            element.style.transform = 'scale(1.1)';
            setTimeout(() => {
                element.style.transform = 'scale(1)';
            }, 200);
        });
    }
    
    // 清空逻辑运算
    function clearLogical() {
        firstBinary.value = '';
        secondBinary.value = '';
        resultBinaryLogical.textContent = '-';
        resultDecimalLogical.textContent = '-';
        resultHexLogical.textContent = '-';
        console.log('逻辑运算已清空');
    }
    
    // 处理逻辑运算符变化
    function handleLogicalOperatorChange() {
        const op = logicalOperator.value;
        if (op === 'NOT') {
            secondBinaryGroup.style.display = 'none';
            secondBinary.value = '';
        } else {
            secondBinaryGroup.style.display = 'block';
        }
    }
    
    // 显示错误信息
    function showError(message) {
        console.error('错误:', message);
        
        // 创建临时错误提示
        const errorDiv = document.createElement('div');
        errorDiv.className = 'error-message';
        errorDiv.textContent = message;
        errorDiv.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: #ff4757;
            color: white;
            padding: 15px 20px;
            border-radius: 10px;
            box-shadow: 0 4px 15px rgba(255, 71, 87, 0.3);
            z-index: 1000;
            font-weight: 600;
            animation: slideIn 0.3s ease;
        `;
        
        document.body.appendChild(errorDiv);
        
        // 3秒后自动移除
        setTimeout(() => {
            errorDiv.style.animation = 'slideOut 0.3s ease';
            setTimeout(() => {
                if (errorDiv.parentNode) {
                    errorDiv.parentNode.removeChild(errorDiv);
                }
            }, 300);
        }, 3000);
    }
    
    // 防抖函数
    function debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }
    
    // 添加CSS动画
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
        
        @keyframes slideOut {
            from {
                transform: translateX(0);
                opacity: 1;
            }
            to {
                transform: translateX(100%);
                opacity: 0;
            }
        }
        
        .result-value {
            transition: transform 0.2s ease;
        }
    `;
    document.head.appendChild(style);
    
    console.log('数值转换工具脚本加载完成');
});
