'use client';

import { useState, useEffect } from 'react';

export default function KeyManagerPage() {
  const [keys, setKeys] = useState([]);
  const [newKey, setNewKey] = useState('');
  const [form, setForm] = useState({
    description: '一年期VIP用户',
    maxUses: 1,
    validDays: 365,
  });

  // 加载密钥列表
  const loadKeys = async () => {
    const res = await fetch('/api/admin/keys');
    const data = await res.json();
    setKeys(data);
  };

  // 生成新密钥
  const handleGenerate = async () => {
    const res = await fetch('/api/admin/keys', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    });
    const result = await res.json();
    if (res.ok) {
      setNewKey(result.key_code);
      loadKeys();
      alert(`新密钥已生成：${result.key_code}`);
    } else {
      alert('生成失败：' + result.error);
    }
  };

  // 复制密钥
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    alert('已复制到剪贴板');
  };

  // 页面加载时获取密钥列表
  useEffect(() => {
    loadKeys();
  }, []);

  return (
    <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
      <h1>访问密钥管理系统</h1>
      
      <div style={{ marginBottom: '30px', padding: '20px', border: '1px solid #ccc', borderRadius: '8px' }}>
        <h2>生成新密钥</h2>
        <div style={{ marginBottom: '10px' }}>
          <label style={{ display: 'inline-block', width: '150px' }}>描述：</label>
          <input
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            style={{ width: '300px', padding: '5px' }}
          />
        </div>
        <div style={{ marginBottom: '10px' }}>
          <label style={{ display: 'inline-block', width: '150px' }}>使用次数：</label>
          <input
            type="number"
            value={form.maxUses}
            onChange={(e) => setForm({ ...form, maxUses: parseInt(e.target.value) || 1 })}
            style={{ width: '80px', padding: '5px' }}
          />
        </div>
        <div style={{ marginBottom: '15px' }}>
          <label style={{ display: 'inline-block', width: '150px' }}>账号有效期(天)：</label>
          <input
            type="number"
            value={form.validDays}
            onChange={(e) => setForm({ ...form, validDays: parseInt(e.target.value) || 30 })}
            style={{ width: '80px', padding: '5px' }}
          />
        </div>
        <button 
          onClick={handleGenerate}
          style={{ 
            background: '#0070f3', 
            color: 'white', 
            border: 'none', 
            padding: '10px 20px',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          生成密钥
        </button>
        
        {newKey && (
          <div style={{ marginTop: '15px', padding: '10px', background: '#f0f8ff', borderRadius: '4px' }}>
            <p><strong>新密钥：</strong> <code>{newKey}</code></p>
            <button 
              onClick={() => copyToClipboard(newKey)}
              style={{ 
                background: '#28a745', 
                color: 'white', 
                border: 'none', 
                padding: '5px 10px',
                borderRadius: '4px',
                cursor: 'pointer',
                marginTop: '5px'
              }}
            >
              复制
            </button>
          </div>
        )}
      </div>

      <div>
        <h2>密钥列表</h2>
        <table style={{ width: '100%', borderCollapse: 'collapse', border: '1px solid #ddd' }}>
          <thead>
            <tr style={{ background: '#f5f5f5' }}>
              <th style={{ border: '1px solid #ddd', padding: '8px' }}>密钥</th>
              <th style={{ border: '1px solid #ddd', padding: '8px' }}>描述</th>
              <th style={{ border: '1px solid #ddd', padding: '8px' }}>已用/次数</th>
              <th style={{ border: '1px solid #ddd', padding: '8px' }}>账号有效期</th>
              <th style={{ border: '1px solid #ddd', padding: '8px' }}>状态</th>
              <th style={{ border: '1px solid #ddd', padding: '8px' }}>操作</th>
            </tr>
          </thead>
          <tbody>
            {keys.map((key: any) => (
              <tr key={key.id}>
                <td style={{ border: '1px solid #ddd', padding: '8px' }}>
                  <code>{key.key_code}</code>
                </td>
                <td style={{ border: '1px solid #ddd', padding: '8px' }}>
                  {key.description}
                </td>
                <td style={{ border: '1px solid #ddd', padding: '8px' }}>
                  {key.used_count} / {key.max_uses}
                </td>
                <td style={{ border: '1px solid #ddd', padding: '8px' }}>
                  {key.account_valid_for_days || '永久'} 天
                </td>
                <td style={{ border: '1px solid #ddd', padding: '8px' }}>
                  {key.is_active ? '✅ 有效' : '❌ 禁用'}
                </td>
                <td style={{ border: '1px solid #ddd', padding: '8px' }}>
                  <button 
                    onClick={() => copyToClipboard(key.key_code)}
                    style={{ 
                      background: '#6c757d', 
                      color: 'white', 
                      border: 'none', 
                      padding: '5px 10px',
                      borderRadius: '4px',
                      cursor: 'pointer'
                    }}
                  >
                    复制
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
