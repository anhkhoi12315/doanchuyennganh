// ===== PROFILE PAGE - LOAD & UPDATE USER INFO =====
let currentProfile = null;

document.addEventListener('DOMContentLoaded', async () => {
  // Check login
  const token = window.api?.getToken && window.api.getToken();
  if (!token) {
    alert('Vui lòng đăng nhập');
    window.location.href = './dangnhap.html';
    return;
  }

  await loadProfile();
  setupProfileForm();
});

async function loadProfile() {
  try {
    const data = await window.api.authFetch('/profile/get-profile');
    
    if (!data.profile) {
      throw new Error(data.message || 'Lỗi tải thông tin');
    }

    currentProfile = data.profile;
    fillFormWithProfile(currentProfile);

  } catch (err) {
    console.error('Error loading profile:', err);
    alert('Lỗi tải thông tin: ' + err.message);
  }
}

function fillFormWithProfile(profile) {
  document.getElementById('fullname').value = profile.fullname || '';
  document.getElementById('email').value = profile.email || '';
  document.getElementById('username').value = profile.username || '';
  document.getElementById('phone').value = profile.phone || '';
  document.getElementById('city').value = profile.city || '';
  document.getElementById('district').value = profile.district || '';
  document.getElementById('ward').value = profile.ward || '';
  document.getElementById('address').value = profile.address || '';
  
  // Gender
  if (profile.gender) {
    document.getElementById('gender').value = profile.gender;
  }
  
  // Birthday - convert to YYYY-MM-DD format
  if (profile.birthday) {
    const date = new Date(profile.birthday);
    const yyyy = date.getFullYear();
    const mm = String(date.getMonth() + 1).padStart(2, '0');
    const dd = String(date.getDate()).padStart(2, '0');
    document.getElementById('birthday').value = `${yyyy}-${mm}-${dd}`;
  }
}

function setupProfileForm() {
  const form = document.getElementById('profile-form');
  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const fullname = document.getElementById('fullname').value.trim();
    const username = document.getElementById('username').value.trim();
    const gender = document.getElementById('gender').value;
    const phone = document.getElementById('phone').value.trim();
    const birthday = document.getElementById('birthday').value;
    const city = document.getElementById('city').value.trim();
    const district = document.getElementById('district').value.trim();
    const ward = document.getElementById('ward').value.trim();
    const address = document.getElementById('address').value.trim();

    if (!fullname || !username || !gender || !phone || !birthday) {
      alert('Vui lòng điền đầy đủ thông tin bắt buộc (*)');
      return;
    }

    // Validate phone
    if (!/^[0-9]{10,11}$/.test(phone)) {
      alert('Số điện thoại không hợp lệ (10-11 chữ số)');
      return;
    }

    try {
      const updateData = {
        fullname,
        username,
        gender,
        phone,
        birthday,
        city: city || null,
        district: district || null,
        ward: ward || null,
        address: address || null
      };

      const result = await window.api.authFetch('/profile/update', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updateData)
      });

      if (!result.profile) {
        throw new Error(result.message || 'Cập nhật thất bại');
      }

      alert('✅ Cập nhật thông tin thành công!');
      currentProfile = result.profile;
      fillFormWithProfile(currentProfile);

    } catch (err) {
      console.error('Update profile error:', err);
      alert('❌ Lỗi cập nhật: ' + err.message);
    }
  });
}

// Export for other pages
window.getUserProfile = async function() {
  try {
    const data = await window.api.authFetch('/profile/get-profile');
    return data.profile || null;
  } catch (err) {
    console.error('Error getting profile:', err);
    return null;
  }
};
