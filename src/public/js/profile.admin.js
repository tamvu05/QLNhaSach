class AdminProfilePage {
    constructor() {
        this.profileForm = document.querySelector('#admin-profile-form')
        this.passwordForm = document.querySelector('#change-password-form')
        this.avatarBtn = document.querySelector('#change-avatar-btn')
        this.avatarInput = document.querySelector('#avatar-input')
        this.avatarImg = document.querySelector('#avatar-image')
        this.avatarPlaceholder = document.querySelector('#avatar-placeholder')
        this.avatarWrapper = document.querySelector('#avatar-wrapper')
        this.avatarObjectUrl = null
        this.pendingAvatarFile = null
        this.serverAvatarSrc = this.avatarImg?.src || null
        this.bindProfileForm()
        this.bindPasswordForm()
        this.bindAvatarUpload()
        this.bindAvatarClick()
    }

    static toISODate(value) {
        const d = new Date(value)
        return isNaN(d.getTime()) ? '' : d.toISOString().slice(0, 10)
    }

    bindProfileForm() {
        if (!this.profileForm) return
        this.profileForm.addEventListener('submit', async (e) => {
            e.preventDefault()
            const submitBtn = this.profileForm.querySelector('button[type="submit"]')
            const originalText = submitBtn?.textContent || ''

            const formData = new FormData(this.profileForm)
            const payload = {
                HoTen: formData.get('HoTen')?.trim(),
                SDT: formData.get('SDT')?.trim(),
                NgaySinh: formData.get('NgaySinh') || '',
                Email: formData.get('Email')?.trim() || undefined,
            }

            if (payload.NgaySinh) payload.NgaySinh = AdminProfilePage.toISODate(payload.NgaySinh)

            try {
                if (submitBtn) {
                    submitBtn.disabled = true
                    submitBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Đang xử lý...'
                }

                if (this.pendingAvatarFile) {
                    await this.uploadPendingAvatar()
                }

                const res = await fetch('/api/profile', {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload),
                })
                const data = await res.json()
                if (!res.ok) throw new Error(data?.message || 'Cập nhật hồ sơ thất bại')

                Swal.fire({ icon: 'success', title: 'Đã cập nhật hồ sơ', timer: 1500, showConfirmButton: false })
            } catch (err) {
                Swal.fire({ icon: 'error', title: 'Không thể cập nhật', text: err.message })
            } finally {
                if (submitBtn) {
                    submitBtn.disabled = false
                    submitBtn.textContent = originalText
                }
            }
        })
    }

    bindPasswordForm() {
        if (!this.passwordForm) return
        this.passwordForm.addEventListener('submit', async (e) => {
            e.preventDefault()
            const formData = new FormData(this.passwordForm)
            const currentPassword = formData.get('currentPassword')?.trim()
            const newPassword = formData.get('newPassword')?.trim()
            const confirmPassword = formData.get('confirmPassword')?.trim()

            if (!currentPassword || !newPassword || !confirmPassword) {
                Swal.fire({ icon: 'warning', title: 'Vui lòng nhập đủ thông tin' })
                return
            }

            if (newPassword !== confirmPassword) {
                Swal.fire({ icon: 'warning', title: 'Mật khẩu mới không khớp' })
                return
            }

            try {
                const res = await fetch('/api/profile/password', {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ currentPassword, newPassword }),
                })
                const data = await res.json()
                if (!res.ok) throw new Error(data?.message || 'Đổi mật khẩu thất bại')

                this.passwordForm.reset()
                const modal = bootstrap.Modal.getInstance(document.getElementById('changePasswordModal'))
                if (modal) modal.hide()
                Swal.fire({ icon: 'success', title: 'Đã đổi mật khẩu', timer: 1500, showConfirmButton: false })
            } catch (err) {
                Swal.fire({ icon: 'error', title: 'Không thể đổi mật khẩu', text: err.message })
            }
        })
    }

    bindAvatarUpload() {
        if (!this.avatarBtn || !this.avatarInput) return

        this.avatarBtn.addEventListener('click', (e) => {
            e.preventDefault()
            this.avatarInput.click()
        })

        this.avatarInput.addEventListener('change', async () => {
            const file = this.avatarInput.files?.[0]
            if (!file) return

            if (this.avatarObjectUrl) {
                URL.revokeObjectURL(this.avatarObjectUrl)
                this.avatarObjectUrl = null
            }

            const objectUrl = URL.createObjectURL(file)
            this.avatarObjectUrl = objectUrl
            this.pendingAvatarFile = file

            if (this.avatarImg) {
                this.avatarImg.src = objectUrl
                this.avatarImg.classList.remove('d-none')
            } else {
                const img = document.createElement('img')
                img.id = 'avatar-image'
                img.src = objectUrl
                img.alt = 'Avatar'
                img.className = 'avatar-img'
                if (this.avatarPlaceholder?.parentNode) {
                    this.avatarPlaceholder.parentNode.replaceChild(img, this.avatarPlaceholder)
                }
                this.avatarImg = img
            }

            if (this.avatarPlaceholder) {
                this.avatarPlaceholder.remove()
                this.avatarPlaceholder = null
            }

            this.avatarInput.value = ''
        })
    }

    bindAvatarClick() {
        if (!this.avatarWrapper) return
        this.avatarWrapper.addEventListener('click', () => {
            if (this.avatarImg?.src) {
                window.open(this.avatarImg.src, '_blank')
            }
        })
    }

    async uploadPendingAvatar() {
        if (!this.pendingAvatarFile) return

        const formData = new FormData()
        formData.append('avatar', this.pendingAvatarFile)

        try {
            const res = await fetch('/api/profile/avatar', {
                method: 'PUT',
                body: formData,
            })
            const data = await res.json()
            if (!res.ok) throw new Error(data?.message || 'Cập nhật ảnh thất bại')

            if (data?.avatar) {
                if (this.avatarImg) {
                    this.avatarImg.src = data.avatar
                    this.avatarImg.classList.remove('d-none')
                }
                this.serverAvatarSrc = data.avatar
            }

            this.pendingAvatarFile = null
            if (this.avatarObjectUrl) {
                URL.revokeObjectURL(this.avatarObjectUrl)
                this.avatarObjectUrl = null
            }
        } catch (err) {
            if (this.serverAvatarSrc && this.avatarImg) {
                this.avatarImg.src = this.serverAvatarSrc
            }
            this.pendingAvatarFile = null
            if (this.avatarObjectUrl) {
                URL.revokeObjectURL(this.avatarObjectUrl)
                this.avatarObjectUrl = null
            }
            throw err
        }
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new AdminProfilePage()
})
