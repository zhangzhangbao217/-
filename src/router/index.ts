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
import ChatRoom from '../views/ChatRoom.vue';
import Register from '../views/Register.vue';
import Profile from '../views/Profile.vue';
import Admin from '../views/Admin.vue';
import LoveGames from '../views/LoveGames.vue';
// @ts-ignore
import AV from 'leancloud-storage';

import Dashboard from '../views/Dashboard.vue'

const routes = [
    { path: '/', redirect: '/login' }, // 根路径重定向到登录页
    { path: '/login', name: 'Login', component: Login },
    { path: '/register', name: 'Register', component: Register },
    {
        path: '/profile',
        name: 'Profile',
        component: Profile,
        meta: { requiresAuth: true }
    },
    {
        path: '/admin',
        name: 'Admin',
        component: Admin,
        meta: { requiresAuth: true, requiresAdmin: true }
    },
    {
        path: '/home',
        component: Home,
        meta: { requiresAuth: true },
        children: [
            { path: '', redirect: '/home/dashboard' },
            { path: 'dashboard', name: 'Dashboard', component: Dashboard },
            {
                path: 'chat',
                name: 'ChatRoom',
                component: ChatRoom
            },
            {
                path: 'anniversary-manage',
                name: 'AnniversaryManage',
                component: AnniversaryManage,
                props: (route: RouteLocationNormalized) => ({
                    anniversaries: JSON.parse((route.query.anniversaries as string) || '[]')
                })
            },
            { path: 'sweet-quote', name: 'SweetQuote', component: SweetQuote },
            {
                path: 'love-album',
                name: 'loveAlbum',
                component: LoveAlbum
            },
            {
                path: 'dian-dian-di-di',
                name: 'DianDianDiDi',
                component: DianDianDiDi,
            },
            {
                path: 'bucket-list',
                name: 'BucketList',
                component: BucketList,
            },
            {
                path: 'contracts',
                name: 'Contracts',
                component: Contracts,
            },
            {
                path: 'games',
                name: 'LoveGames',
                component: LoveGames,
            }
        ]
    }
]

const router = createRouter({
    history: createWebHistory(),
    routes
})

// 路由守卫：登录校验与权限控制
router.beforeEach((to, from, next) => {
    const currentUser = AV.User.current();
    
    if (to.meta.requiresAuth && !currentUser) {
        next('/login')
        ElMessage.warning('请先登录～')
    } else if (to.meta.requiresAdmin && (!currentUser || !currentUser.get('isAdmin'))) {
        next('/home')
        ElMessage.error('权限不足，仅管理员可访问')
    } else {
        next()
    }
})

export default router
