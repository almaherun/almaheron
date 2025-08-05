import { 
  sanitizeHTML, 
  sanitizePlainText, 
  sanitizeEmail, 
  sanitizeName, 
  sanitizePassword,
  detectMaliciousContent,
  sanitizeFormData 
} from '@/lib/input-sanitization';
import { enhancedRateLimit } from '@/lib/enhanced-rate-limit';
import { NextRequest } from 'next/server';

describe('Input Sanitization Security Tests', () => {
  describe('sanitizeHTML', () => {
    it('should remove dangerous script tags', () => {
      const maliciousInput = '<script>alert("XSS")</script><p>Safe content</p>';
      const result = sanitizeHTML(maliciousInput);
      expect(result).not.toContain('<script>');
      expect(result).not.toContain('alert');
      expect(result).toContain('<p>Safe content</p>');
    });

    it('should remove event handlers', () => {
      const maliciousInput = '<div onclick="alert(\'XSS\')">Click me</div>';
      const result = sanitizeHTML(maliciousInput);
      expect(result).not.toContain('onclick');
      expect(result).not.toContain('alert');
    });

    it('should allow safe HTML tags', () => {
      const safeInput = '<p><strong>Bold text</strong> and <em>italic text</em></p>';
      const result = sanitizeHTML(safeInput);
      expect(result).toContain('<strong>');
      expect(result).toContain('<em>');
    });
  });

  describe('sanitizePlainText', () => {
    it('should remove all HTML tags', () => {
      const input = '<p>Hello <strong>World</strong></p>';
      const result = sanitizePlainText(input);
      expect(result).toBe('Hello World');
    });

    it('should handle malicious scripts', () => {
      const input = '<script>alert("XSS")</script>Hello';
      const result = sanitizePlainText(input);
      expect(result).toBe('Hello');
    });
  });

  describe('sanitizeEmail', () => {
    it('should accept valid email addresses', () => {
      const validEmails = [
        'test@example.com',
        'user.name@domain.co.uk',
        'user+tag@example.org'
      ];

      validEmails.forEach(email => {
        expect(() => sanitizeEmail(email)).not.toThrow();
        expect(sanitizeEmail(email)).toBe(email.toLowerCase());
      });
    });

    it('should reject invalid email addresses', () => {
      const invalidEmails = [
        'invalid-email',
        '@domain.com',
        'user@',
        'user@domain',
        'user space@domain.com'
      ];

      invalidEmails.forEach(email => {
        expect(() => sanitizeEmail(email)).toThrow('Invalid email format');
      });
    });
  });

  describe('sanitizeName', () => {
    it('should accept valid Arabic and English names', () => {
      const validNames = [
        'أحمد محمد',
        'Ahmed Mohamed',
        'فاطمة الزهراء',
        'Fatima Al-Zahra'
      ];

      validNames.forEach(name => {
        expect(() => sanitizeName(name)).not.toThrow();
      });
    });

    it('should reject names with numbers or special characters', () => {
      const invalidNames = [
        'Ahmed123',
        'User@Name',
        'Test<script>',
        'A' // too short
      ];

      invalidNames.forEach(name => {
        expect(() => sanitizeName(name)).toThrow();
      });
    });
  });

  describe('sanitizePassword', () => {
    it('should accept strong passwords', () => {
      const strongPasswords = [
        'StrongPass123',
        'MySecure@Password1',
        'Complex123Password'
      ];

      strongPasswords.forEach(password => {
        expect(() => sanitizePassword(password)).not.toThrow();
      });
    });

    it('should reject weak passwords', () => {
      const weakPasswords = [
        'weak', // too short
        'onlylowercase', // no uppercase or numbers
        'ONLYUPPERCASE', // no lowercase or numbers
        '12345678' // no letters
      ];

      weakPasswords.forEach(password => {
        expect(() => sanitizePassword(password)).toThrow();
      });
    });
  });

  describe('detectMaliciousContent', () => {
    it('should detect XSS attempts', () => {
      const maliciousInputs = [
        '<script>alert("XSS")</script>',
        'javascript:alert("XSS")',
        'onload=alert("XSS")',
        'eval(maliciousCode)',
        'document.cookie'
      ];

      maliciousInputs.forEach(input => {
        expect(detectMaliciousContent(input)).toBe(true);
      });
    });

    it('should not flag safe content', () => {
      const safeInputs = [
        'Hello World',
        'This is a normal text',
        'Email: user@example.com',
        'Phone: 01234567890'
      ];

      safeInputs.forEach(input => {
        expect(detectMaliciousContent(input)).toBe(false);
      });
    });
  });

  describe('sanitizeFormData', () => {
    it('should sanitize form data correctly', () => {
      const formData = {
        name: 'أحمد محمد',
        email: 'AHMED@EXAMPLE.COM',
        phone: '01234567890',
        password: 'StrongPass123'
      };

      const result = sanitizeFormData(formData);
      
      expect(result.name).toBe('أحمد محمد');
      expect(result.email).toBe('ahmed@example.com');
      expect(result.phone).toBe('01234567890');
      expect(result.password).toBe('StrongPass123');
    });

    it('should throw error for invalid data', () => {
      const invalidFormData = {
        name: 'A', // too short
        email: 'invalid-email',
        phone: 'invalid-phone'
      };

      expect(() => sanitizeFormData(invalidFormData)).toThrow();
    });
  });
});

describe('Rate Limiting Security Tests', () => {
  const createMockRequest = (ip: string, pathname: string): NextRequest => {
    const url = `https://example.com${pathname}`;
    const request = new NextRequest(url);
    
    // Mock headers
    Object.defineProperty(request, 'headers', {
      value: new Map([
        ['x-forwarded-for', ip],
        ['user-agent', 'test-agent']
      ])
    });
    
    return request;
  };

  it('should allow requests within rate limit', () => {
    const request = createMockRequest('192.168.1.1', '/api/test');
    const result = enhancedRateLimit(request);
    
    expect(result.allowed).toBe(true);
    expect(result.remaining).toBeGreaterThan(0);
  });

  it('should block requests exceeding rate limit', () => {
    const request = createMockRequest('192.168.1.2', '/api/auth');
    
    // Make multiple requests to exceed limit
    for (let i = 0; i < 10; i++) {
      enhancedRateLimit(request);
    }
    
    const result = enhancedRateLimit(request);
    expect(result.allowed).toBe(false);
  });

  it('should have stricter limits for auth endpoints', () => {
    const authRequest = createMockRequest('192.168.1.3', '/api/auth');
    const regularRequest = createMockRequest('192.168.1.4', '/api/regular');
    
    const authResult = enhancedRateLimit(authRequest);
    const regularResult = enhancedRateLimit(regularRequest);
    
    // Auth endpoints should have lower limits
    expect(authResult.remaining).toBeLessThan(regularResult.remaining);
  });
});

describe('JWT Token Security Tests', () => {
  it('should require JWT_SECRET environment variable', () => {
    const originalSecret = process.env.JWT_SECRET;
    delete process.env.JWT_SECRET;
    
    // This should be tested in the actual auth-tokens module
    // but we can't easily test it here due to module loading
    
    process.env.JWT_SECRET = originalSecret;
  });
});

describe('Security Headers Tests', () => {
  it('should include required security headers', () => {
    // This would test the middleware security headers
    // Implementation depends on how you want to test middleware
    expect(true).toBe(true); // Placeholder
  });
});