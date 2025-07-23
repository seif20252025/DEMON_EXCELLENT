
import discord
from discord.ext import commands
import asyncio
import threading
import json
import os
from datetime import datetime, timedelta
import random
import re
from flask import Flask, render_template, request, jsonify
from flask_cors import CORS
import time

# إعداد Flask
app = Flask(__name__)
CORS(app)

# قاعدة البيانات البسيطة (JSON)
DATA_FILE = 'users_data.json'

def load_data():
    try:
        with open(DATA_FILE, 'r', encoding='utf-8') as f:
            return json.load(f)
    except FileNotFoundError:
        return {}

def save_data(data):
    with open(DATA_FILE, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=2)

# تحميل البيانات
users_data = load_data()

# إعداد Discord Bot
intents = discord.Intents.all()
bot = commands.Bot(command_prefix='!', intents=intents)

# كلمات محظورة
BANNED_WORDS = ['كس', 'كسمك', 'متناكه', 'الاحبه', 'احبه', 'امك', 'ابوك', 'انيك', 'اهلك', 'كسختك', 'لبوه', 'يبنل', 'يبن', 'ديك', 'دين']

# مستويات المستخدمين
LEVELS = [
    {"name": "「👤」Demon Member", "xp": 0},
    {"name": "「👥」Demon Beginner", "xp": 30},
    {"name": "「🔥」Demon Advanced", "xp": 100},
    {"name": "「⚡」Demon Expert", "xp": 210},
    {"name": "「📢」Demon Leader", "xp": 350},
    {"name": "「🕹️」Demon Commander", "xp": 600},
    {"name": "「🎖️」Demon Colonel", "xp": 3000}
]

def get_user_data(user_id):
    if str(user_id) not in users_data:
        users_data[str(user_id)] = {
            "name": "",
            "vex": 100,
            "xp": 0,
            "level": 0,
            "last_message": datetime.now().isoformat(),
            "daily_tasks": {},
            "weekly_tasks": {},
            "codes": [],
            "messages_count": 0,
            "daily_messages": 0,
            "weekly_messages": 0,
            "last_daily_reset": datetime.now().date().isoformat(),
            "last_weekly_reset": datetime.now().date().isoformat()
        }
        save_data(users_data)
    return users_data[str(user_id)]

def update_xp(user_id, xp_gain=5):
    user = get_user_data(user_id)
    user["xp"] += xp_gain
    
    # تحديث المستوى
    for i, level in enumerate(LEVELS):
        if user["xp"] >= level["xp"]:
            user["level"] = i
    
    save_data(users_data)
    return user

@bot.event
async def on_ready():
    print(f'🤖 {bot.user} قد دخل إلى الخدمة!')
    await bot.change_presence(status=discord.Status.dnd, activity=discord.Game("DEMON EXCELLENT"))

@bot.event
async def on_member_join(member):
    try:
        # إعطاء رول العضو الجديد
        role = discord.utils.get(member.guild.roles, name="「👤」Demon Member")
        if role:
            await member.add_roles(role)
        
        # رسالة ترحيب
        channel = discord.utils.get(member.guild.channels, name="welcome")
        if channel:
            embed = discord.Embed(
                title="مرحباً بك في DEMON EXCELLENT! 🔥",
                description=f"منور حبي {member.mention}❤️",
                color=0x8B0000
            )
            embed.set_thumbnail(url=member.avatar.url if member.avatar else member.default_avatar.url)
            await channel.send(embed=embed)
    except Exception as e:
        print(f"خطأ في ترحيب العضو: {e}")

@bot.event
async def on_message(message):
    if message.author.bot:
        return
    
    try:
        # فحص الكلمات المحظورة
        for word in BANNED_WORDS:
            if word in message.content.lower():
                await message.delete()
                try:
                    await message.author.timeout(timedelta(minutes=10), reason="استخدام كلمات محظورة")
                    await message.channel.send(f"{message.author.mention} تم إعطاؤك ميوت لمدة 10 دقائق بسبب استخدام كلمات محظورة!")
                except:
                    pass
                return
        
        # تحديث عدد الرسائل والمهام
        user = get_user_data(message.author.id)
        current_date = datetime.now().date().isoformat()
        
        # إعادة تعيين المهام اليومية
        if user.get("last_daily_reset") != current_date:
            user["daily_messages"] = 0
            user["daily_tasks"] = {}
            user["last_daily_reset"] = current_date
        
        # إعادة تعيين المهام الأسبوعية (كل يوم اثنين)
        current_week = datetime.now().isocalendar()[1]
        last_week = datetime.fromisoformat(user.get("last_weekly_reset", current_date)).isocalendar()[1]
        if current_week != last_week:
            user["weekly_messages"] = 0
            user["weekly_tasks"] = {}
            user["last_weekly_reset"] = current_date
        
        # تحديث عداد الرسائل
        user["messages_count"] += 1
        user["daily_messages"] += 1
        user["weekly_messages"] += 1
        
        # فحص المهام اليومية
        if user["daily_messages"] >= 10 and not user["daily_tasks"].get("discord_chat"):
            user["daily_tasks"]["discord_chat"] = True
            user["vex"] += 20
            try:
                await message.channel.send(f"🎉 {message.author.mention} أكمل مهمة التفاعل اليومية! حصل على 20 ڤكس!")
            except:
                pass
        
        # فحص المهام الأسبوعية
        if user["weekly_messages"] >= 50 and not user["weekly_tasks"].get("discord_chat_weekly"):
            user["weekly_tasks"]["discord_chat_weekly"] = True
            user["vex"] += 100
            user["xp"] += 50
            try:
                await message.channel.send(f"🏆 {message.author.mention} أكمل مهمة التفاعل الأسبوعية! حصل على 100 ڤكس و 50 XP!")
            except:
                pass
        
        # إضافة XP
        user = update_xp(message.author.id)
        
        # حفظ البيانات
        save_data(users_data)
        
        await bot.process_commands(message)
    except Exception as e:
        print(f"خطأ في معالجة الرسالة: {e}")

@bot.command(name='Demon')
async def demon_command(ctx):
    try:
        embed = discord.Embed(
            title="DEMON EXCELLENT 🔥",
            description="""**منصه متخصصه في صنع مواقع الويب و بوتات ديسكورد و الذي تعمل لتوفير احتياجتكم من مواقع الويب  و بوتات الديسكورد❤️**

**__المواقع الويب الموجوده🔥:__**
**GAMES SHOP🛒:**
فكره الموقع : موقع متخصص في التجاره و فكرته هي تجاره بين الاعضاء في مجال الالعاب🛒

**DEMON EDITS✂️**
**فكره الموقع : هو موقع للتصاميم موجود فيه تصميم صوره ، تحسين جوده الصوره ، مع رموز و اسامي زخرفيه✂️**

**DEMON CASH💵**
**فكره الموقع: هو موقع يربح مال من خلال فعل المهام و مشاهده و الاعلانات و تجميع نقاط لتبديلهم بمال💵❤️**

**DEMON GAMES🕹️**
**نعمل عليه🔨**

**أوامر بوت الديسكورد📢:**
`!Demon` - عرض هذه القائمة
`!بيانات` - عرض بيانات المستخدم
`!give @user amount` - إعطاء ڤكس لمستخدم
`!Vex @user amount` - إعطاء ڤكس (للإدارة فقط)
`!كود` - الحصول على كود دخول الموقع""",
            color=0x8B0000
        )
        
        view = DemonView()
        await ctx.send(embed=embed, view=view)
    except Exception as e:
        print(f"خطأ في أمر Demon: {e}")

class DemonView(discord.ui.View):
    def __init__(self):
        super().__init__(timeout=300)
    
    @discord.ui.button(label="شراء شي🛒", style=discord.ButtonStyle.success)
    async def shopping_button(self, interaction: discord.Interaction, button: discord.ui.Button):
        try:
            guild = interaction.guild
            user = interaction.user
            
            # إنشاء روم التسوق
            overwrites = {
                guild.default_role: discord.PermissionOverwrite(read_messages=False),
                user: discord.PermissionOverwrite(read_messages=True, send_messages=True),
                guild.me: discord.PermissionOverwrite(read_messages=True, send_messages=True)
            }
            
            # إضافة صلاحيات للإدارة
            for role in guild.roles:
                if role.permissions.administrator:
                    overwrites[role] = discord.PermissionOverwrite(read_messages=True, send_messages=True)
            
            channel = await guild.create_text_channel(
                f"SHOPPING_{user.display_name}",
                overwrites=overwrites
            )
            
            embed = discord.Embed(
                title="🛒 قسم التسوق",
                description="لو عايز تشتري بوتات ديسكورد أو تبرمج مواقع ويب منشن الادمن❤️",
                color=0x8B0000
            )
            
            await channel.send(embed=embed)
            await interaction.response.send_message(f"تم إنشاء روم التسوق {channel.mention}", ephemeral=True)
        except Exception as e:
            print(f"خطأ في زر التسوق: {e}")
            await interaction.response.send_message("حدث خطأ في إنشاء روم التسوق!", ephemeral=True)
    
    @discord.ui.button(label="تـــــــــــكـــــــــت🎫", style=discord.ButtonStyle.primary)
    async def ticket_button(self, interaction: discord.Interaction, button: discord.ui.Button):
        try:
            guild = interaction.guild
            user = interaction.user
            
            # البحث عن فئة التذاكر أو إنشاؤها
            category = discord.utils.get(guild.categories, name="GAME TICKET")
            if not category:
                category = await guild.create_category("GAME TICKET")
            
            # إنشاء روم التذكرة
            overwrites = {
                guild.default_role: discord.PermissionOverwrite(read_messages=False),
                user: discord.PermissionOverwrite(read_messages=True, send_messages=True),
                guild.me: discord.PermissionOverwrite(read_messages=True, send_messages=True)
            }
            
            # إضافة صلاحيات للإدارة
            for role in guild.roles:
                if role.permissions.administrator:
                    overwrites[role] = discord.PermissionOverwrite(read_messages=True, send_messages=True)
            
            channel = await guild.create_text_channel(
                f"TICKET_{user.display_name}",
                category=category,
                overwrites=overwrites
            )
            
            embed = discord.Embed(
                title="🎫 تذكرة دعم فني",
                description=f"مرحباً {user.mention}! كيف يمكننا مساعدتك اليوم؟",
                color=0x8B0000
            )
            
            await channel.send(embed=embed)
            await interaction.response.send_message(f"تم إنشاء التذكرة {channel.mention}", ephemeral=True)
        except Exception as e:
            print(f"خطأ في زر التذكرة: {e}")
            await interaction.response.send_message("حدث خطأ في إنشاء التذكرة!", ephemeral=True)

@bot.command(name='بيانات')
async def user_stats(ctx, member: discord.Member = None):
    try:
        if member is None:
            member = ctx.author
        
        user = get_user_data(member.id)
        current_level = LEVELS[user["level"]]
        next_level = LEVELS[user["level"] + 1] if user["level"] + 1 < len(LEVELS) else None
        
        embed = discord.Embed(
            title=f"بيانات {member.display_name}👤",
            color=0x8B0000
        )
        
        embed.add_field(name="اسم العضو🏷️", value=member.mention, inline=False)
        embed.add_field(name="عدد ڤكس💸", value=f"{user['vex']} ڤكس", inline=True)
        embed.add_field(name="مستواه🎖️", value=current_level["name"], inline=True)
        
        if next_level:
            xp_needed = next_level["xp"] - user["xp"]
            progress = (user["xp"] - current_level["xp"]) / (next_level["xp"] - current_level["xp"])
            bar_length = 20
            filled = int(bar_length * progress)
            bar = "█" * filled + "░" * (bar_length - filled)
            embed.add_field(name="التقدم للمستوى التالي", value=f"{bar}\n{xp_needed} XP متبقي", inline=False)
        
        embed.set_thumbnail(url=member.avatar.url if member.avatar else member.default_avatar.url)
        
        await ctx.send(embed=embed)
    except Exception as e:
        print(f"خطأ في أمر البيانات: {e}")

@bot.command(name='give')
async def give_vex(ctx, member: discord.Member, amount: int):
    try:
        if amount <= 0:
            await ctx.send("يجب أن يكون المبلغ أكبر من صفر!")
            return
        
        giver = get_user_data(ctx.author.id)
        receiver = get_user_data(member.id)
        
        if giver["vex"] < amount:
            await ctx.send("ليس لديك ڤكس كافي!")
            return
        
        giver["vex"] -= amount
        receiver["vex"] += amount
        save_data(users_data)
        
        embed = discord.Embed(
            title="✅ تم التحويل بنجاح",
            description=f"تم تحويل {amount} ڤكس من {ctx.author.mention} إلى {member.mention}",
            color=0x00FF00
        )
        await ctx.send(embed=embed)
    except Exception as e:
        print(f"خطأ في أمر Give: {e}")

@bot.command(name='Vex')
@commands.has_permissions(administrator=True)
async def admin_give_vex(ctx, member: discord.Member, amount: int):
    try:
        receiver = get_user_data(member.id)
        receiver["vex"] += amount
        save_data(users_data)
        
        embed = discord.Embed(
            title="✅ تم إعطاء الڤكس بنجاح",
            description=f"تم إعطاء {amount} ڤكس لـ {member.mention}",
            color=0x00FF00
        )
        await ctx.send(embed=embed)
    except Exception as e:
        print(f"خطأ في أمر Vex: {e}")

@bot.command(name='كود')
async def generate_code(ctx):
    try:
        user = get_user_data(ctx.author.id)
        code = f"DEMON_{random.randint(100000, 999999)}"
        user["codes"].append(code)
        save_data(users_data)
        
        try:
            await ctx.author.send(f"كودك للدخول إلى الموقع: `{code}`")
            await ctx.send("تم إرسال الكود إليك في الخاص!")
        except:
            await ctx.send(f"كودك للدخول إلى الموقع: `{code}`")
    except Exception as e:
        print(f"خطأ في أمر الكود: {e}")

# Flask Routes
@app.route('/')
def home():
    return render_template('index.html')

@app.route('/login', methods=['POST'])
def login():
    try:
        data = request.json
        name = data.get('name')
        code = data.get('code')
        
        # البحث عن المستخدم باستخدام الكود
        for user_id, user_data in users_data.items():
            if code in user_data.get('codes', []):
                user_data['name'] = name
                save_data(users_data)
                return jsonify({
                    'success': True,
                    'user_id': user_id,
                    'user_data': user_data
                })
        
        return jsonify({'success': False, 'message': 'كود غير صحيح'})
    except Exception as e:
        print(f"خطأ في تسجيل الدخول: {e}")
        return jsonify({'success': False, 'message': 'حدث خطأ في الخادم'})

@app.route('/user/<user_id>')
def get_user(user_id):
    try:
        if user_id in users_data:
            return jsonify(users_data[user_id])
        return jsonify({'error': 'المستخدم غير موجود'})
    except Exception as e:
        print(f"خطأ في جلب بيانات المستخدم: {e}")
        return jsonify({'error': 'خطأ في الخادم'})

@app.route('/leaderboard')
def leaderboard():
    try:
        # ترتيب المستخدمين حسب الڤكس
        vex_leaders = sorted(users_data.items(), key=lambda x: x[1]['vex'], reverse=True)
        
        # ترتيب المستخدمين حسب المستوى ثم XP
        level_leaders = sorted(users_data.items(), key=lambda x: (x[1]['level'], x[1]['xp']), reverse=True)
        
        # ترتيب المستخدمين حسب عدد الرسائل
        chat_leaders = sorted(users_data.items(), key=lambda x: x[1].get('messages_count', 0), reverse=True)
        
        return jsonify({
            'vex_leaders': vex_leaders[:10],
            'level_leaders': level_leaders[:10],
            'chat_leaders': chat_leaders[:10]
        })
    except Exception as e:
        print(f"خطأ في لوحة المتصدرين: {e}")
        return jsonify({
            'vex_leaders': [],
            'level_leaders': [],
            'chat_leaders': []
        })

@app.route('/health')
def health_check():
    return jsonify({'status': 'ok', 'timestamp': datetime.now().isoformat()})

@app.route('/discord_avatar/<user_id>')
def get_discord_avatar(user_id):
    try:
        # البحث عن المستخدم في Discord
        discord_user = bot.get_user(int(user_id))
        if discord_user and discord_user.avatar:
            avatar_url = discord_user.avatar.url
        else:
            # استخدام صورة افتراضية من Discord
            avatar_url = f"https://cdn.discordapp.com/embed/avatars/{int(user_id) % 5}.png"
        
        return jsonify({'avatar_url': avatar_url})
    except Exception as e:
        print(f"خطأ في جلب صورة Discord: {e}")
        return jsonify({'avatar_url': f"https://cdn.discordapp.com/embed/avatars/{int(user_id) % 5}.png"})

def run_flask():
    try:
        print("🌐 بدء تشغيل خادم الويب...")
        app.run(host='0.0.0.0', port=5000, debug=False, threaded=True)
    except Exception as e:
        print(f"خطأ في تشغيل Flask: {e}")

def run_bot():
    try:
        BOT_TOKEN = os.getenv('DISCORD_BOT_TOKEN')
        if BOT_TOKEN:
            print("🤖 بدء تشغيل بوت ديسكورد...")
            bot.run(BOT_TOKEN)
        else:
            print("⚠️ لم يتم العثور على توكن البوت. يرجى إضافة DISCORD_BOT_TOKEN في الـ Secrets")
    except Exception as e:
        print(f"خطأ في تشغيل البوت: {e}")

def keep_alive():
    """وظيفة للحفاظ على التطبيق نشطاً"""
    while True:
        try:
            time.sleep(300)  # انتظار 5 دقائق
            print(f"🔄 التطبيق يعمل - {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
        except Exception as e:
            print(f"خطأ في keep_alive: {e}")

if __name__ == '__main__':
    try:
        # تشغيل Flask في thread منفصل
        flask_thread = threading.Thread(target=run_flask, daemon=True)
        flask_thread.start()
        
        # تشغيل keep_alive في thread منفصل
        keep_alive_thread = threading.Thread(target=keep_alive, daemon=True)
        keep_alive_thread.start()
        
        print("🚀 تم تشغيل الموقع على المنفذ 5000")
        print("🤖 جاري تشغيل بوت ديسكورد...")
        
        # تشغيل البوت في الـ main thread
        run_bot()
        
    except KeyboardInterrupt:
        print("⏹️ تم إيقاف التطبيق بواسطة المستخدم")
    except Exception as e:
        print(f"خطأ عام في التطبيق: {e}")
