# Smart Touch Panel — Plan B: 系统监测 Widget

> 从 MiniPulse（ai.hermes.minipulse v2.0.0）移植的系统监测能力
> 
> MiniPulse 源码: `/Users/mini/Projects/MiniPulseV2_*/Sources/App/`
> 
> 所有数据通过 macOS 标准 API 获取，无需外部依赖

## Plan B: 移植 MiniPulse 系统监测

### 背景

MiniPulse（`ai.hermes.minipulse` v2.0.0）是 macOS 原生系统监测应用，ARM64 编译，包含完整的系统监控能力。源码在 `/Users/mini/Projects/MiniPulseV2_*/Sources/App/`，数据模型和 UI 已验证可直接移植。

### MiniPulse 数据模型

所有数据通过标准 macOS API 获取，无需外部依赖：

```swift
SysInfo       — hostname, osVersion, hwModel, uptime, IPs, displayResolutions
CpuInfo       — percent, perCore[], physical/logical cores, freq, user/system/idle
MemoryInfo    — totalGB, usedGB, availableGB, freeGB, percent, swap
GpuInfo       — name, vramMB, utilization, chip, utilizationHistory
TempInfo      — cpuPowerMw, gpuPowerMw, cpuTempC, gpuTempC, thermalPressure
BatteryInfo   — percent, charging, timeLeft, cycleCount
DiskInfo      — name, mountpoint, totalGB, usedGB, freeGB, percent
NetworkInfo   — interfaces, IPs, bytesIn, bytesOut
TopProcess    — name, pid, cpu%, mem%, ...
```

### STP Widget 清单

| # | Widget | 尺寸 | 类型 | 说明 |
|---|--------|------|------|------|
| 13 | CPU 监控 | 3×2 | `cpu-monitor` | 使用率% + 每核柱状图 + 温度 + 频率 |
| 14 | 内存监控 | 2×1 | `mem-monitor` | 已用/总量 + 进度条 + 交换 |
| 15 | GPU 监控 | 2×1 | `gpu-monitor` | 型号 + 利用率 + 温度 |
| 16 | 网络监控 | 3×1 | `net-monitor` | 接口 + IP + 收发速率 |
| 17 | 磁盘监控 | 3×2 | `disk-monitor` | 卷列表 + 已用/总量 + IO |
| 18 | 功耗监控 | 2×1 | `power-monitor` | CPU/GPU 功耗 mW + 热状态 |
| 19 | 电池监控 | 2×1 | `battery-monitor` | 电量% + 充电状态 + 循环数 |
| 20 | 机器信息 | 3×2 | `machine-info` | 主机名/型号/系统/运行时间 |
| 21 | 外接设备 | 3×2 | `devices-info` | USB/Thunderbolt 设备列表 |
| 22 | Top CPU | 4×3 | `top-cpu` | CPU 占用 Top N 进程 |
| 23 | Top Mem | 4×3 | `top-mem` | 内存占用 Top N 进程 |

### 服务端实现

所有数据通过 Python `ctypes`/`pyobjc` 调用 macOS API，不依赖外部二进制：

```
server/
├── system_monitor.py       # MiniPulse 数据模型移植
│   ├── get_cpu_info()      # host_processor_info
│   ├── get_memory_info()   # host_statistics
│   ├── get_gpu_info()      # IOKit IOReport
│   ├── get_network_info()  # getifaddrs
│   ├── get_disk_info()     # statvfs + IOKit
│   ├── get_power_info()    # SMC + NSProcessInfo
│   ├── get_battery_info()  # IOKit
│   ├── get_machine_info()  # sysctl
│   ├── get_devices()       # IOKit HID
│   ├── get_top_cpu()       # proc_listallpids
│   └── get_top_mem()       # proc_pidinfo
```

### API

```
GET /api/system/cpu        → {percent, perCore[], freq, user, system, idle, temp}
GET /api/system/memory     → {totalGB, usedGB, availableGB, percent, swap}
GET /api/system/gpu        → {name, utilization, temp, vram}
GET /api/system/network    → [{iface, ip, bytesIn, bytesOut}]
GET /api/system/disk       → [{name, mountpoint, totalGB, usedGB, percent}]
GET /api/system/power      → {cpuMw, gpuMw, thermalPressure}
GET /api/system/battery    → {percent, charging, timeLeft, cycles}
GET /api/system/machine    → {hostname, osVersion, model, uptime}
GET /api/system/devices    → [{name, vendor, type}]
GET /api/system/top-cpu    → [{name, pid, percent}]
GET /api/system/top-mem    → [{name, pid, memGB}]
```

### iPad 渲染

`client/ipad/34-monitoring.js` — 11 个 Canvas 渲染函数：
- `_drawCpuCard(canvas, data)` — 仪表盘 + 柱状图
- `_drawMemCard(canvas, data)` — 进度条 + 数字
- `_drawGpuCard(canvas, data)` — 同上
- ... 等

每个 widget 自动轮询对应的 API（1-2 秒间隔），实时更新 Canvas。

### Widget Library 分组更新

```
📊 System Monitor  CPU, Memory, GPU, Network, Disk, Power,
                   Battery, Machine, Devices, Top CPU, Top Mem
```

## Plan A + Plan B 合并总览

| 分类 | Widget 数 |
|------|----------|
| Keys | 1 |
| Touch | 1 |
| Audio | 5 |
| Display | 1 |
| System (Dock/Menu/App) | 3 |
| Windows | 3 |
| Data | 2 |
| **System Monitor (Plan B)** | **11** |
| **合计** | **27** |

## 实施优先级

Phase 0（架构准备）→ Phase 1-5（Plan A 音频/显示/Dock/菜单/窗口）→ **Phase 7（Plan B 系统监测）**
## 实施说明

Plan B 作为 Plan A 的扩展，共用 Phase 0 建立的架构基础设施（Profile 类型系统、iPad 常驻区域、Widget Library 分组）。监测类 Widget 在 Widget Library 中归入 "📊 System Monitor" 分组。

实施优先级：Phase 0 → Plan A(Phase 1-6) → Plan B(Phase 7)
