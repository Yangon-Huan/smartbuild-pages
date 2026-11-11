# 百隧智云软件统一配置
# 修改文字或 data/ 下的素材路径，保存后刷新页面即可生效。
# 图片、视频、点云、BIM 模型统一存放在 data/；路径相对于软件根目录。
# 每个 ## 区块对应一个页面或功能，冒号左边是配置名，右边是显示值。

## app
name: 百隧智云
subtitle: 隧道施工智能检测装备与BIM协同系统
project: 智慧感知与计算项目演示
project_code: IMC-2026-DEMO
operator: 演示账号
site: 隧道施工现场演示
status: 本地演示
logo_text: 百隧智云
footer: 百隧智云创新大赛 · 本地预设演示数据

## schedule
start_time: 08:30:00
end_time: 17:30:00
current_stage: 智能检测

## labels
workspace: 演示章节 / WORKSPACE
current_project: 当前项目
stage: 当前阶段
project_overview: 项目总览
live_clock: 本地时间
window: 演示时间窗
start: 开始时间
end: 结束时间
progress: 处理进度
status: 任务状态
results: 检测结果
start_action: 开始检测
next_action: 下一步
previous_action: 上一步
complete_action: 完成
record: 检测记录
local_asset: 本地演示素材
preset_notice: 预设演示数据 · 未连接现场设备与AI推理服务
breadcrumbs: 功能演示 / 隧道施工智能检测

## navigation
items: 项目背景|background|◈;智能装备|equipment|▣;智慧感知|perception|⌁;智能检测|inspection|▤;BIM数字孪生|bim|⬡

## background
heading: 面向隧道施工的百隧智云方案
lead: 智能装备、智慧感知、智能检测与BIM数字孪生协同构成施工质量管理闭环。
image: data/首页.png
start_time: 08:30:00
end_time: 08:30:30
progress: 100
state: 方案总览
panel_title: 四大能力协同闭环
cards: 智能装备|多传感器移动采集;智慧感知|点云与RGB语义理解;智能检测|几何与外观质量分析;BIM数字孪生|检测信息关联工程构件
notice: 演示流程：现场采集 → 智慧感知 → 质量检测 → BIM映射。

## equipment
heading: 智能装备与现场采集
lead: 移动采集平台搭载三维激光扫描仪、工业相机、LED补光和视频图传，演示隧道现场数据采集。
image: data/现场.png
secondary_image: data/小车.png
start_time: 09:12:08
end_time: 09:18:42
progress: 100
state: 采集完成
panel_title: 现场视频与设备画面
metrics: 三维激光扫描|已连接（演示）;工业相机|已连接（演示）;LED补光|已开启（演示）;视频图传|前视 / 后视
cards: 前视视频|现场前视预览;后视视频|现场后视预览
notice: 视频中的环境视频窗口用于显示小车前后视角画面；当前使用随包图片模拟视频窗口。

## perception
heading: 点云与图像智慧感知
lead: 并列查看点云反射强度着色和语义类别着色，展示隧道工程对象识别与语义分割。
image: data/BIM1.png
image: data/点云反射强度预览.png
secondary_image: data/点云语义类别预览.png
end_time: 09:20:45
progress: 100
state: 感知结果已生成（演示）
panel_title: 反射强度着色 / 语义类别着色
metrics: 点云输入|隧道点云01.ply|;语义模型|Point Transformer V3|;类别输出|工程对象语义分割|;演示模式|预设着色视图|
cards: 左侧视图|反射强度着色;右侧视图|语义类别着色
notice: 此页以随包图片模拟反射强度与语义分割视图，不对原始点云运行模型推理。
pointcloud: data/隧道点云01.ply

## inspection
heading: 隧道施工质量智能检测
lead: 选择检测任务，查看检测图像、预设参数、病害统计或断面热力图。
image: data/几何参数测量.png
start_time: 09:25:00
end_time: 09:36:32
progress: 100
state: 检测结果已生成（演示）
panel_title: 检测工作区
subtabs: 槽道几何|geometry;外观病害|defect;平整度分析|flatness
active_subtab: geometry
action_labels: 开始检测|下一步|完成
notice: 页面中的操作用于演示预设工作流，不触发模型推理。

## geometry
heading: 预埋槽道几何参数检测
lead: 基于点云断面，查看槽道间距、宽度和横向偏差等参数。
image: data/几何参数测量.png
secondary_image: data/几何参数测量2.png
start_time: 09:25:00
end_time: 09:25:18
progress: 100
state: 检测完成
panel_title: 几何参数结果
columns: 槽道编号|间距(mm)|宽度(mm)|左偏差(mm)|右偏差(mm)
rows: 01|1195|40.19|0.2|0.4;02|1196|40.12|0.1|0.3;03|1194|40.25|0.3|0.5
metrics: 检测槽道|235|道;间距均值|1,195|mm;槽道宽度|40.19|mm;横向偏差|0.4|mm

## defect
heading: 衬砌外观病害检测
lead: 展示裂缝、渗漏等病害定位、面积统计与严重程度评估。
image: data/外观.png
secondary_image: data/外观检测.png
start_time: 09:31:22
end_time: 09:31:48
progress: 100
state: 识别完成
panel_title: 病害识别与程度评估
columns: 病害类型|面积(m²)|严重程度
rows: 裂缝|0.036|中;渗漏|0.287|高
metrics: 识别病害|2|处;裂缝面积|0.036|m²;渗漏面积|0.287|m²;严重等级|中 / 高|级

## flatness
heading: 衬砌平整度分析
lead: 通过热力图与衬砌横断面直观查看偏差分布，并统计超限区段和侵蚀面积。
image: data/平整度.png
start_time: 09:36:00
end_time: 09:36:32
progress: 100
state: 分析完成
panel_title: 热力图 / 衬砌断面 / 区段统计
columns: 区段|平均偏差(mm)|最大偏差(mm)|超限面积(m²)|侵蚀面积(m²)
rows: 00|0.136|0.130|0.030|0.077;01|0.130|0.147|0.029|0.068;02|0.128|0.106|0.066|0.049;03|0.115|0.127|0.046|0.050;04|0.104|0.165|0.024|0.032;05|0.099|0.163|0.025|0.054
metrics: 平整度均值|1.3|mm;检测区段|24|段;超限区段|预设统计|;侵蚀面积|预设统计|m²

## bim
heading: BIM数字孪生与质量信息映射
lead: 将现场采集及检测结果关联到本地隧道BIM模型，查看模型与构件映射信息。
image: data/BIM1.png
start_time: 09:42:00
end_time: 09:42:45
progress: 100
state: 映射完成（演示）
panel_title: BIM模型与检测信息
model: data/隧道BIM.ifc
pointcloud: data/隧道点云01.ply
columns: 构件编码|构件类型|关联检测|质量状态
rows: LIN-001|二衬|平整度|已关联;CH-018|预埋槽道|几何尺寸|已关联;DEF-026|衬砌表面|外观病害|已关联
metrics: BIM文件|隧道BIM.ifc|;点云文件|隧道点云01.ply|;映射方式|预设关联|;数据状态|本地演示|
notice: IFC和PLY为随包本地素材。当前映射清单为演示数据，不修改模型文件。

## bim_page
parent: 数据分析
title: BIM建模
close_label: 返回首页
back_button: 返回首页
model_card: BIM模型
pointcloud_card: 点云数据
cards: 左|—|分析完成;右|—|未分析;右|—|未分析
record_unit: 项
preview_title: BIM模型展示
build_button: BIM建模
rebuild_button: 重新BIM建模
export_button: 导出建模
loading_button: 建模中…
initial_hint: 点击 BIM建模 加载隧道模型
loading_hint: 正在读取 IFC 并建立交互模型…
tree_title: BIM构件元素树
tree_hint: 建模后显示构件
select_hint: 请选择模型构件查看参数
element_unit: 个构件
viewer_model: data/隧道BIM.glb
viewer_entities: data/隧道BIM.elements.json
camera_position: 1.0,-0.25,0.27
camera_target: 0.28,0,0
preview_note: 本地模型预览
detail_label: 详情
file_label: 模型文件
info_title: 模型与关联信息
mapping_count_label: 关联构件
mapping_status_label: 映射状态
mapping_title: 构件关联

## home
name: 百隧智云
eyebrow: BAISUI INTELLIGENT CLOUD
headline: 让每一米隧道
outline_headline: 清晰可见
description: 融合点云、影像与 BIM 数据，提供从现场采集到检测分析的一体化工作空间。
summary_eyebrow: PLATFORM OVERVIEW
summary_title: 铁路隧道检测
summary_title_second: 与 BIM 数字孪生
summary_items: 现场采集|履带平台同步采集隧道点云、槽道影像及环境视频。;检测分析|测量槽道几何参数，识别锈蚀与脱落，并以热力图和横断面展示衬砌平整度。;BIM关联|将检测结果对应到隧道构件，提供模型预览与标准 IFC 文件。
robot_image: data/小车.png
background_image: 
buttons: 槽道检测|geometry|▣;槽道外观检测|defect|◉;平整度检测|flatness|▤;BIM建模|bim|⬡;现场采集|equipment|⚙
user_icon: 👤
switch_icon: ⇄
settings_icon: ⚙
shutdown_icon: ⏻
user_tooltip: 切换用户
settings_tooltip: 设置
shutdown_tooltip: 退出软件

## login
heading: 切换用户
user_label: 用户
password_label: 登录口令
submit_label: 登录
cancel_label: 取消
error_text: 口令错误，请重试
users: czng|1234;演示用户|1234;管理员|1234

## settings
heading: 软件设置
scale_label: 界面缩放
motion_label: 小车动画
motion_on: 开启
motion_off: 关闭
save_label: 保存设置
cancel_label: 取消

## shutdown
heading: 退出软件
message: 确定退出本地演示软件？
confirm_label: 退出
cancel_label: 取消
closed_message: 软件已退出，请关闭此页面。

## analysis
heading: 数据分析
search_placeholder: 任务名称
search_button: 搜索
columns: 任务名称|线路|标段|工点|工点(英文)|分析状态|操作
tasks: 222||||qqq|分析中
pending_status: 分析中
done_status: 分析完成
analyze_action: 分析
working_action: 分析中…
open_action: 查看结果
delete_action: 删除
empty_text: 暂无匹配任务
total_prefix: 共
total_suffix: 条
previous_label: 上一页
next_label: 下一页
close_label: 关闭数据分析
back_label: 返回首页
scroll_up_label: 向上滚动任务
scroll_down_label: 向下滚动任务
scroll_label: 任务列表滚动条
running_notice: 正在使用本地预设数据分析任务…
done_notice: 分析完成，点击“查看结果”查看检测页面。
deleted_notice: 已从当前演示列表删除任务。
analysis_delay_ms: 1800
page_size: 6

## analysis_detail
heading: 数据分析
close_label: 返回任务列表
back_button: 返回任务列表
next_button: 下一个
route_label: 线路
route_value: 测试路线
segment_label: 标段
segment_value: 测试标段
site_label: 工点
site_value: 测试隧道
chute_label: 滑槽(单据)
chute_value: —
export_button: 导出测量数据
export_filename: 槽道测量数据.csv
export_notice: 测量数据已导出为 CSV。
detail_label: 详情
analyzed_label: 已分析数量
pending_label: 待分析数量
no_data_label: 无点云数据数量
count_unit: 个
analyzed_count: 0
pending_count: 36
no_data_count: 0
single_button: 单滑槽分析
all_button: 一键分析
status_label: 分析状态
done_status: 分析完成
pending_status: 未分析
working_status: 分析中
engineering_label: 接口工程内容
engineering_value: 接触网预留槽道
mileage_label: 铁路里程
mileage_default: —
location_label: 所在位置
edit_button: 编辑
edit_heading: 编辑分析工作区
save_button: 保存
cancel_button: 取消
cards: 左|—|未分析;右|—|未分析;右|—|未分析
measurement_columns: 间距(mm)|深度(mm)|预埋槽道横线路方向偏转(%)|顺线路方向槽道位置|环向方向槽道位置(mm)|水平槽道倾斜(%)
measurement_values: 1195|40.19|0.4|K12+480|20.5|0.2
awaiting_text: 待检测
empty_value: —
file_accept: .ply,.xyz,.pts,.txt,.csv
selected_file_prefix: 已选择文件：
running_notice: ，正在进行本地预设分析…
all_running_notice: 正在执行一键分析…
done_notice: 分析完成，测量结果已更新。
analysis_delay_ms: 1800
preview_title: 滑槽
constant_button: Constant
strength_button: strength
constant_field_label: scalar_Constant
strength_field_label: scalar_strength
constant_range: 抽样值范围 -11 ～ 81
strength_range: 抽样值范围 7 ～ 2131
scalar_sample_label: 当前显示点数：
geometry_button: 几何参数
clear_button: 清空
confirm_button: 确定
file_label: 文件：
mouse_help: 左键拖动旋转；右键或 Shift+左键拖动平移；滚轮缩放；Shift+滚轮平移
loading_text: 正在加载点云…
empty_preview_text: 点云已清空，请重新选择文件
preview_closed_text: 点云预览已关闭
preset_result_text: 预设分析已完成
loading_notice: 正在读取本地点云…
loaded_prefix: 已载入点云：
loaded_suffix: 个点（抽样预览），请确认。
unsupported_text: 不支持此格式，请选择 PLY、XYZ、PTS、TXT 或 CSV 点云。
too_large_text: 文件超过本地预览大小限制。
load_error_text: 点云读取失败，请检查文件内容。
timeout_text: 点云加载超时，请重新选择文件。
load_timeout_ms: 30000
cancel_notice: 已取消本次点云预览。
cleared_notice: 当前点云与预览参数已清空。
max_file_mb: 500
max_preview_points: 40000
preview_cache_path: data/隧道点云01.preview.bin
preview_cache_filename: 隧道点云01.ply
preview_cache_size: 92978552
scroll_up_label: 向上滚动工作区
scroll_down_label: 向下滚动工作区
scroll_label: 分析工作区滚动条

export_no_cloud_notice: 请先选择本地点云并点击“确定”，再导出测量数据。
export_saving_notice: 正在保存测量 Excel…
export_saved_prefix: 已保存测量数据：
export_failed_prefix: 保存失败：
## measurement_export
heading: 数据分析
group_heading: 
row_labels: 第1组|总结
awaiting_text: 待检测

cloud_file_label: 点云文件
work_area_label: 工作区
source_label: 数据来源
source_value: 本地预设演示结果
## one_click_analysis
heading: 数据分析
folder_name: 导出数据
group_heading:
summary_label: 总结
twist_label: 滑槽扭转、变形情况
loading_button: 分析中
loading_notice: 正在分析导出数据…
loading_ms: 3000
select_notice: 请选择导出数据文件夹
folder_error: 请选择 data 下的导出数据文件夹
done_notice: 分析完成，已匹配点云记录：
error_prefix: 分析失败：
awaiting_text:

## image_analysis
detail_label: 详情
heading: 数据分析 > 图像分析
heading_parent: 数据分析
heading_separator: >
heading_current: 图像分析
route_label: 线路
route_value: 测试路线
segment_label: 标段
segment_value: 测试标段
site_label: 工点
site_value: 测试隧道
chute_label: 滑槽(单据)
chute_value: —
start_button: 开始检测
working_button: 检测中…
restart_button: 重新检测
capture_status_label: 采集状态
engineering_label: 接口工程内容
engineering_value: 接触网预留槽道
pending_status: 未采集
working_status: 检测中
done_status: 检测完成
mileage_label: 铁路里程
mileage_default: —
location_label: 所在位置
edit_button: 编辑
edit_heading: 编辑图像分析工作区
save_button: 保存
cancel_button: 取消
cards: 左|—;右|—;前|—
image_label: 图像分析
image: data/外观检测前.png
detected_image: data/外观检测.png
rust_label: 锈蚀
spall_label: 脱落
dictionary_label: 缺陷字典库
defect_columns: 缺陷|面积|严重程度
defect_rows: 锈蚀|0.036|中;脱落|0.287|高
pending_notice:
working_notice: 正在使用本地预设数据检测…
done_notice:
detect_delay_ms: 2000
back_button: 返回首页
scroll_up_label: 向上滚动工作区
scroll_down_label: 向下滚动工作区
scroll_label: 图像分析工作区滚动条

## capture_ui
heading: 现场采集
counter: 222
route_label: 线路
route_value: 测试路线
segment_label: 标段
segment_value: 测试标段
site_label: 工点
site_value: 测试隧道
chute_label: 滑槽(单据)
chute_value: —
detail_label: 详情
start_button: 开始采集
working_button: 采集中…
completed_button: 重新采集
capture_status_label: 采集状态
uncaptured_label: 未采集
completed_label: 采集完成
collecting_label: 正在采集
engineering_label: 接口工程内容
engineering_value: 接触网预留槽道
mileage_label: 铁路里程
mileage_default: —
location_label: 所在位置
edit_button: 编辑
edit_heading: 编辑采集工作区
save_button: 保存
cancel_button: 取消
image_label: 滑槽高清成像
video_label: 环境视频（本地预览）
front_label: 小车前视角
rear_label: 小车后视角
next_button: 下一个
back_button: 返回
start_time_label: 开始时间
end_time_label: 结束时间
start_time: 09:12:08
end_time: 09:18:42
capture_delay_ms: 1800
cards: 右|—;左|—;前|—
slot_image: data/槽道高清成像.png
front_image: data/环境视频前视.png
rear_image: data/环境视频后视.png
front_video: 
rear_video: 

## flatness_ui
detail_label: 详情
title: 平整度分析
back_button: 返回首页
route_label: 线路
route_value: 测试路线
segment_label: 标段
segment_value: 测试标段
site_label: 工点
site_value: 测试隧道
chute_label: 滑槽(单据)
chute_value: —
start_button: 开始检测
working_button: 检测中…
restart_button: 重新检测
capture_status_label: 采集状态
pending_status: 未采集
working_status: 检测中
done_status: 检测完成
engineering_label: 接口工程内容
engineering_value: 接触网预留槽道
mileage_label: 铁路里程
mileage_default: —
location_label: 所在位置
edit_button: 编辑
edit_heading: 编辑工作区
save_button: 保存
cancel_button: 取消
image_heading: 热力图/衬砌横断面
heatmap_image: data/热力图.png
section_image: data/衬砌横断面.png
table_columns: 里程|超限面积|侵蚀面积|最大超限|最大侵蚀
cards: 左|—;右|—;左|—
detect_delay_ms: 1000

# 对尚未单独列出的页面文字，可在这里按“原文字: 新文字”覆盖。
# 保存后刷新页面；例如：开始检测: 立即检测
## text_overrides
