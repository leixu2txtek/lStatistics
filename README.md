# lStatistics

基于 nodejs & mongodb 的实时 pageview 统计服务，其中包含一些业务层面的统计信息：

例如： 用户类型，学生所在学校代码，学生所在教学点ID，学生所在班级ID等信息；



安装方法：

1. npm install      //安装所需包
2. 更改 config.js 中的配置信息，主要是 mongodb 的链接支付串
3. 执行 node init_collection 生成 mongodb 数据表
4. 执行 node index 启动服务



打开浏览器，输入 http://localhost:2345/ 浏览器中会返回当日的访问信息

{"online":5,"total":244,"today":244}


PS：本工程是在项目中使用的，有什么问题可以在 issues 提出，谢谢；