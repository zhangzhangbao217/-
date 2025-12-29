import { createRouter, createWebHistory, type RouteLocationNormalized } from 'vue-router'
import Login from '@/views/Login.vue'
// 示例：创建首页组件（src/views/Home.vue）
import Home from '@/views/Home.vue'
// 导入新建的纪念日管理组件
import AnniversaryManage from '../views/AnniversaryManage.vue'
import {ElMessage} from "element-plus";
// 新增：导入甜蜜语录库组件（后续创建）
import SweetQuote from '../views/SweetQuote.vue'
// 新增：导入恋爱相册组件
import LoveAlbum from '@/views/LoveAlbum.vue'
//新总点点滴滴组件
import DianDianDiDi from '../views/DianDianDiDi.vue';
import BucketList from '../views/BucketList.vue';
import Contracts from '../views/Contracts.vue';
const routes = [
    { path: '/', redirect: '/login' }, // 根路径重定向到登录页
    { path: '/login', name: 'Login', component: Login },
    {
        path: '/home',
        name: 'Home',
        component: Home,
        meta: { requiresAuth: true } // 需要登录才能访问
    },
    // 新增纪念日管理路由
    {
        path: '/anniversary-manage',
        name: 'AnniversaryManage',
        component: AnniversaryManage,
        // 接收待办纪念日数据作为路由参数
        props: (route: RouteLocationNormalized) => ({
            anniversaries: JSON.parse((route.query.anniversaries as string) || '[]')
        })
    },
    // 新增：甜蜜语录库路由
    { path: '/sweet-quote', name: 'SweetQuote', component: SweetQuote },
    // 新增：恋爱相册路由
    {
        path: '/love-album',
        name: 'loveAlbum',
        component: LoveAlbum
    },
    {
        path: '/dian-dian-di-di', // 新增路由
        name: 'DianDianDiDi',
        component: DianDianDiDi,
    },
    {
        path: '/bucket-list',
        name: 'BucketList',
        component: BucketList,
    },
    {
        path: '/contracts',
        name: 'Contracts',
        component: Contracts,
    }
]

const router = createRouter({
    history: createWebHistory(),
    routes
})

// 路由守卫：未登录禁止访问首页
router.beforeEach((to, from, next) => {
    if (to.meta.requiresAuth && !localStorage.getItem('token')) {
        next('/login')
        ElMessage.warning('请先登录～')
    } else {
        next()
    }
})

export default router
