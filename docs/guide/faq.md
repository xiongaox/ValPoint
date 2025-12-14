# 常见问题

## 作者信息相关

### Q: 作者头像显示不出来？

**原因**：B 站和抖音的图片有防盗链保护。

**解决方案**：确保所有 `<img>` 标签添加了 `referrerPolicy="no-referrer"` 属性。

```tsx
<img 
  src={authorInfo.avatar} 
  referrerPolicy="no-referrer"  // 🔥 必须添加
  alt={authorInfo.name}
/>
```

### Q: 无法获取作者信息？

检查以下几点：

1. **视频链接格式是否正确**
   - B 站：`https://www.bilibili.com/video/BV...`
   - 抖音：`https://v.douyin.com/...`

2. **Supabase Edge Function 是否正常运行**
   - 访问 Supabase Dashboard 检查函数状态

3. **环境变量是否配置正确**
   - 检查 `.env` 文件中的配置

4. **查看浏览器控制台的错误信息**
   - 按 F12 打开开发者工具
   - 查看 Console 和 Network 标签

## 图片上传相关

### Q: 图片上传失败？

检查图床配置：

1. **Access Key 和 Secret Key 是否正确**
2. **Bucket 名称和区域是否匹配**
3. **是否有上传权限**
4. **网络连接是否正常**

### Q: 剪贴板上传不工作？

可能的原因：

1. **浏览器不支持 Clipboard API**
   - 推荐使用最新版 Chrome、Firefox、Edge

2. **没有授予剪贴板权限**
   - 浏览器会提示授权，请允许

3. **剪贴板中没有图片**
   - 确保已复制图片（不是图片路径）

## 共享相关

### Q: 共享链接失效？

**原因**：共享链接有效期为 15 天。

**解决方案**：过期后需要重新分享。

### Q: 复制点位时提示已存在？

**原因**：系统自动防重，同一共享点位同一用户只能保存一份。

**解决方案**：这是正常行为，无需重复保存。

## 数据相关

### Q: 如何备份我的点位数据？

点位数据存储在 Supabase 数据库中，可以通过以下方式备份：

1. **Supabase Dashboard 导出**
   - 访问 Supabase Dashboard
   - 进入 Table Editor
   - 选择 `valorant_lineups` 表
   - 点击 Export 导出 CSV

2. **使用 Supabase CLI**
   ```bash
   supabase db dump -f backup.sql
   ```

### Q: 删除的点位可以恢复吗？

**不可以**。删除操作不可恢复，请谨慎操作。

建议：
- 重要点位先分享到共享库
- 定期导出数据备份

## 浏览器相关

### Q: 支持哪些浏览器？

推荐使用最新版本的：
- ✅ Chrome / Edge（推荐）
- ✅ Firefox
- ✅ Safari
- ❌ IE（不支持）

### Q: 移动端可以使用吗？

- 暂未适配（会有计划）

## 性能相关

### Q: 加载速度慢？

可能的原因：

1. **网络问题**
   - 检查网络连接
   - 尝试刷新页面

2. **图片过大**
   - 系统会自动压缩图片
   - 建议上传前手动压缩

3. **Supabase 服务器响应慢**
   - 等待片刻重试
   - 检查 Supabase 服务状态

### Q: 图片加载失败？

1. **检查图床配置**
2. **检查图片 URL 是否有效**
3. **检查网络连接**
4. **尝试重新上传**

## 其他问题

### Q: 如何联系开发者？

- GitHub Issues：[提交问题](https://github.com/xiongaox/valpoint/issues)
- Email：2638130023@qq.com

### Q: 可以贡献代码吗？

欢迎！请查看 [开发文档](/dev/overview) 了解如何参与开发。

### Q: 项目是开源的吗？

是的，项目采用 MIT 许可证开源。

